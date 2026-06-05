import { Router } from "express";
import { prisma, Role } from "@repo/db";
import { hashPassword } from "@repo/auth-middleware";
import { producer } from "../utils/kafka.js";

const router: Router = Router();

const USER_ROLES = new Set<Role>(["USER", "HOST", "ADMIN"]);

const parseRole = (role: unknown) =>
  typeof role === "string" && USER_ROLES.has(role as Role) ? (role as Role) : null;

const parseOptionalRole = (role: unknown) => {
  if (role === undefined || role === null || role === "") return undefined;
  return parseRole(role);
};

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
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get all hosts (admin only)
router.get("/hosts", async (req, res) => {
  try {
    const { verified } = req.query;

    const hosts = await prisma.user.findMany({
      where: {
        role: "HOST",
        deletedAt: null,
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
        hostingSince: true,
        createdAt: true,
        _count: {
          select: { spaces: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(hosts);
  } catch (error) {
    console.error("Get hosts error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create user (admin only)
router.post("/", async (req, res) => {
  try {
    const { email, username, password, name, role } = req.body;
    const parsedRole = parseOptionalRole(role);

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username, and password are required" });
    }
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user already exists (ignore soft-deleted rows so freed-up
    // email/username can be re-used after anonymization).
    const existingUser = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || null,
        role: parsedRole || "USER",
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    // Send Kafka event
    producer.send("user.created", {
      value: {
        username: user.username,
        email: user.email,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update user (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, name, role, image } = req.body;
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(name !== undefined && { name }),
        ...(parsedRole && { role: parsedRole }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
      // Invalidate any active refresh-token sessions.
      prisma.session.deleteMany({ where: { userId: id } }),
    ]);

    return res
      .status(200)
      .json({ message: "User anonymized successfully (soft-delete; history retained)" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
    console.error("Verify host error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Change user role (admin only)
router.put("/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const parsedRole = parseRole(role);
    if (!parsedRole) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
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
    console.error("Change role error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
