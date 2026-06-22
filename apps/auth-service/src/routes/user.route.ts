import { Router } from "express";
import { randomBytes } from "crypto";
import { prisma, Role } from "@repo/db";
import { hashPassword, normalizeEmail } from "@repo/auth-middleware";
import { producer } from "../utils/kafka.js";
import { sendPrismaError } from "../utils/prismaErrors.js";
import { generateInviteToken, INVITE_TTL_DAYS } from "../utils/inviteToken.js";

const router: Router = Router();

const USER_ROLES = new Set<Role>(["USER", "HOST", "ADMIN"]);

const parseRole = (role: unknown) =>
  typeof role === "string" && USER_ROLES.has(role as Role) ? (role as Role) : null;

const parseOptionalRole = (role: unknown) => {
  if (role === undefined || role === null || role === "") return undefined;
  return parseRole(role);
};

// Password policy: bcrypt truncates at 72 bytes, so 72 is a hard upper bound.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

function validatePassword(pw: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof pw !== "string") {
    return { ok: false, message: "Password must be a string" };
  }
  if (pw.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (pw.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }
  return { ok: true, value: pw };
}

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

function slugifyForEmail(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function generateRandomPassword(): string {
  // 64 cryptographically-secure random bytes. Lead accounts cannot log in
  // until an invite/password-reset flow rotates it.
  return randomBytes(64).toString("base64");
}

// Human-transcribable temp password: 14 chars from an unambiguous alphabet
// (no 0/O/1/l/I) so an admin can read it aloud or copy it from a note without
// transcription errors. >= PASSWORD_MIN_LENGTH by construction.
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

// Magic-link base for invites, e.g. https://admin.spacefly.ai/accept-invite.
// The raw token is appended as ?token=...; only its hash is stored.
function buildInviteUrl(rawToken: string): string {
  const base = process.env.INVITE_LINK_BASE ?? "";
  return `${base}?token=${encodeURIComponent(rawToken)}`;
}

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    const parsedRole = parseOptionalRole(role);
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(parsedRole ? { role: parsedRole } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        hostVerified: true,
        hostingSince: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(users);
  } catch (error) {
    return sendPrismaError(res, error, "Get users error");
  }
});

// Get all hosts (admin only). Pass ?include=admins to also include ADMIN users.
router.get("/hosts", async (req, res) => {
  try {
    const { verified, include } = req.query;
    const includeAdmins = include === "admins";

    const hosts = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: includeAdmins ? { in: ["HOST", "ADMIN"] } : "HOST",
        ...(verified !== undefined && { hostVerified: verified === "true" }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        hostVerified: true,
        emailVerified: true,
        hostingSince: true,
        createdAt: true,
        _count: {
          select: { spaces: true },
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
    });

    return res.status(200).json(hosts);
  } catch (error) {
    return sendPrismaError(res, error, "Get hosts error");
  }
});

// Create lead host account (admin only).
// Lead accounts cannot log in until an invite/password-reset rotates the random
// password. Used by the admin host-switcher to onboard new hosts.
router.post("/hosts/lead", async (req, res) => {
  try {
    const { name, username, email: rawEmail, bio, hostingSince } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 80) {
      return res.status(400).json({ message: "Name is required (max 80 chars)" });
    }
    if (typeof username !== "string" || !USERNAME_REGEX.test(username) || username.length < 3 || username.length > 32) {
      return res.status(400).json({ message: "Username must be 3-32 chars, lowercase letters, digits, _ or -" });
    }
    if (bio !== undefined && bio !== null && (typeof bio !== "string" || bio.length > 500)) {
      return res.status(400).json({ message: "Bio must be a string up to 500 chars" });
    }

    const email = rawEmail
      ? normalizeEmail(String(rawEmail))
      : `hosts+${slugifyForEmail(username)}@spacefly.ai`;

    const existing = await prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ message: "User with this email or username already exists" });
    }

    const hashedPassword = await hashPassword(generateRandomPassword());

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name.trim(),
        role: "HOST",
        hostVerified: true,
        emailVerified: false,
        mustChangePassword: true,
        bio: typeof bio === "string" ? bio : null,
        hostingSince: typeof hostingSince === "string" ? new Date(hostingSince) : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        bio: true,
        hostVerified: true,
        emailVerified: true,
        hostingSince: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Create lead host error");
  }
});

// Create (or refresh) an email invite for an existing user. Admin-only via
// the /users mount guard. Deletes any prior unaccepted invite for the user,
// inserts a fresh Invite (hash stored, raw emitted), and emits user.invited.
// Returns the inviteUrl so the admin can copy it as an offline fallback.
router.post("/:id/invite", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { raw, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const invitedById = req.userId ?? null;

    // One live invite per user: clear prior unaccepted invites, then insert.
    await prisma.$transaction([
      prisma.invite.deleteMany({ where: { userId: user.id, acceptedAt: null } }),
      prisma.invite.create({
        data: {
          userId: user.id,
          tokenHash,
          email: user.email,
          role: user.role,
          invitedById,
          expiresAt,
        },
      }),
    ]);

    // Best-effort publish (GOTCHA 9): the Invite row is the durable side
    // effect; a Kafka outage must not fail the admin call — the returned
    // inviteUrl lets the admin relay the link manually.
    try {
      await producer.send("user.invited", {
        value: {
          email: user.email,
          name: user.name ?? null,
          token: raw,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(
        "Failed to publish user.invited event for",
        user.id,
        "- invite created but email will not fire:",
        err instanceof Error ? err.message : err,
      );
    }

    return res.status(200).json({ inviteUrl: buildInviteUrl(raw), expiresAt: expiresAt.toISOString() });
  } catch (error) {
    return sendPrismaError(res, error, "Create invite error");
  }
});

// Get single user (admin only)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        emailVerified: true,
        hostVerified: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Get user error");
  }
});

// Create user (admin only)
router.post("/", async (req, res) => {
  try {
    const { email: rawEmail, username, password, name, role } = req.body;
    const parsedRole = parseOptionalRole(role);

    if (!rawEmail || !username || !password) {
      return res.status(400).json({ message: "Email, username, and password are required" });
    }
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // AUTHMW-003: normalize at the entry point.
    const email = normalizeEmail(String(rawEmail));

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return res.status(400).json({ message: pwCheck.message });
    }

    // Check if user already exists (ignore soft-deleted rows so freed-up
    // email/username can be re-used after anonymization; Prisma P2002
    // handler also covers race).
    const existingUser = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User with this email or username already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(pwCheck.value);

    // Create user — admin-provisioned accounts must rotate the password on first login.
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || null,
        role: parsedRole || "USER",
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Send Kafka event.
    // The user row is already committed; do not fail the admin call if the
    // event publish fails — admin tooling will see the user listed even
    // without the welcome-email side effect.
    // TODO(KAFKA-001 follow-up): transactional outbox.
    try {
      await producer.send("user.created", {
        value: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (err) {
      console.error(
        "Failed to publish user.created event (admin create) for",
        user.id,
        "- account created but welcome email will not fire:",
        err instanceof Error ? err.message : err
      );
    }

    return res.status(201).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Create user error");
  }
});

// Update user (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email: rawEmail, username, name, role, image, password } = req.body;
    const parsedRole = parseOptionalRole(role);
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Refuse to mutate soft-deleted users.
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    // AUTHMW-003: normalize email at the entry point.
    const email = rawEmail ? normalizeEmail(String(rawEmail)) : undefined;


    // If a password rotation is requested, validate + hash it. We also flip
    // mustChangePassword off (the admin has just set a known value) and
    // invalidate every existing session so other devices are forced to re-auth.
    let hashedPassword: string | undefined;
    if (password !== undefined && password !== null && password !== "") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) {
        return res.status(400).json({ message: pwCheck.message });
      }
      hashedPassword = await hashPassword(pwCheck.value);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(name !== undefined && { name }),
        ...(parsedRole && { role: parsedRole }),
        ...(image !== undefined && { image }),
        ...(hashedPassword !== undefined && {
          password: hashedPassword,
          mustChangePassword: false,
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate sessions only after the user update succeeds.
    if (hashedPassword !== undefined) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return res.status(200).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Update user error");
  }
});

// Set (or generate) a temporary password for an existing user and force a
// rotation on next login. Returns the plaintext exactly once so the admin can
// hand it to the host. Mounted under `/users` with shouldBeAdmin.
router.post("/:id/temp-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body ?? {};

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    let tempPassword: string;
    if (password !== undefined && password !== null && password !== "") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) {
        return res.status(400).json({ message: pwCheck.message });
      }
      tempPassword = pwCheck.value;
    } else {
      tempPassword = generateTempPassword();
    }

    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true },
      select: { id: true },
    });

    // Invalidate existing sessions so the only way back in is the new temp
    // password, which then forces the onboarding wizard.
    await prisma.session.deleteMany({ where: { userId: id } });

    return res.status(200).json({ tempPassword });
  } catch (error) {
    return sendPrismaError(res, error, "Set temp password error");
  }
});

// Delete user (admin only)
//
// DB-004: this endpoint does NOT hard-delete the User row.
//
// Hard-deletion is unsupported because most user-facing relations
// (Venue/Space/Booking/Review/Payout) use the default onDelete: RESTRICT
// and changing them to Cascade would wipe booking and payout history that
// the platform must retain for legal/accounting (tax records typically
// 5-7yr). Flipping the rules to Cascade was considered and rejected.
//
// Instead we "anonymize, don't delete":
//   - Scrub PII (email -> deleted-<id>@deleted.spacefly.ai, names -> [deleted],
//     phone/bio/image -> null, username -> deleted-<id>).
//   - Stamp deletedAt = now.
//   - Drop active sessions so the account can no longer authenticate.
// All auth and listing paths in this service filter out rows where
// deletedAt IS NOT NULL, so the row is invisible to the rest of the app
// while bookings/payouts retain their foreign-key target.
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const callerId = req.userId;

    if (callerId && callerId === id) {
      return res.status(400).json({ message: "Cannot delete your own account via this endpoint" });
    }

    // Last-admin guard: load the target so we know whether removing them would
    // empty out the ADMIN role.
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return res
          .status(409)
          .json({ message: "Cannot remove the last remaining admin" });
      }
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const anonymizedEmail = `deleted-${id}@deleted.spacefly.ai`;
    const anonymizedUsername = `deleted-${id}`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          email: anonymizedEmail,
          username: anonymizedUsername,
          name: "[deleted]",
          phone: null,
          bio: null,
          image: null,
          // Scramble password hash so it can never match a login attempt.
          // (Long random string is not a valid bcrypt hash; comparePassword
          // will simply return false.)
          password: `!deleted!${id}!${Date.now()}`,
          emailVerified: false,
          hostVerified: false,
          deletedAt: new Date(),
        },
      }),
      // Invalidate any active legacy sessions (Session table).
      prisma.session.deleteMany({ where: { userId: id } }),
      // Revoke every refresh token in the rotation chain so /auth/refresh
      // can no longer mint a fresh access token for the deleted user. Without
      // this, a soft-deleted user with a still-valid refresh token kept on
      // their device could continue silently rolling new access tokens until
      // the refresh token naturally expired (up to 7 days).
      prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return res
      .status(200)
      .json({ message: "User anonymized successfully (soft-delete; history retained)" });
  } catch (error) {
    return sendPrismaError(res, error, "Delete user error");
  }
});

// Verify host (admin only)
router.put("/:id/verify-host", async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    if (typeof verified !== "boolean") {
      return res.status(400).json({ message: "verified must be a boolean" });
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "HOST") {
      return res.status(400).json({ message: "User is not a host" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        hostVerified: verified,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hostVerified: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return sendPrismaError(res, error, "Verify host error");
  }
});

// Change user role (admin only)
router.put("/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const callerId = req.userId;

    const parsedRole = parseRole(role);
    if (!parsedRole) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (callerId && callerId === id) {
      return res
        .status(400)
        .json({ message: "Cannot change your own role via this endpoint" });
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    // Last-admin guard: if we're demoting the target away from ADMIN and they
    // are currently the only admin, refuse.
    if (parsedRole !== "ADMIN" && existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN", deletedAt: null },
      });
      if (adminCount <= 1) {
        return res
          .status(409)
          .json({ message: "Cannot demote the last remaining admin" });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: parsedRole,
        ...(parsedRole === "HOST" && { hostingSince: new Date() }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        hostVerified: true,
        hostingSince: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Change role error");
  }
});

// Set per-host platform commission rate (admin only).
//
// Body: `{ "commissionRate": 0.15 }` to set 15%, or `{ "commissionRate": null }`
// to clear the override and fall back to DEFAULT_COMMISSION_RATE. Only HOST or
// ADMIN users carry a meaningful commission — other roles are rejected so the
// column stays semantically clean.
router.put("/:id/commission-rate", async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body ?? {};

    let nextRate: number | null;
    if (commissionRate === null || commissionRate === "") {
      nextRate = null;
    } else if (
      typeof commissionRate === "number" &&
      Number.isFinite(commissionRate) &&
      commissionRate >= 0 &&
      commissionRate <= 1
    ) {
      nextRate = commissionRate;
    } else {
      return res.status(400).json({
        message: "commissionRate must be a number between 0 and 1, or null to clear the override",
      });
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    if (existing.role !== "HOST" && existing.role !== "ADMIN") {
      return res.status(400).json({
        message: "Commission rate only applies to HOST or ADMIN users",
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { commissionRate: nextRate },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        commissionRate: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Set commission rate error");
  }
});

export default router;
