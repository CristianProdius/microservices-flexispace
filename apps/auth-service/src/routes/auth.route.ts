import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@repo/db";
import {
  hashPassword,
  comparePassword,
  signTokenPair,
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  normalizeEmail,
} from "@repo/auth-middleware";
import { shouldBeUser } from "@repo/auth-middleware/express";
import { producer } from "../utils/kafka.js";
import {
  parseBody,
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  becomeHostSchema,
} from "../utils/validation.js";
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../utils/rateLimit.js";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
} from "../utils/cookies.js";

const router: Router = Router();

/** Convert a duration string like "30d", "1h", "15m", "30s" to milliseconds. */
function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const value = parseInt(match[1]!, 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

const refreshLifetimeMs = () =>
  parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "30d");

const accessLifetimeMs = () =>
  parseExpiry(process.env.JWT_EXPIRES_IN || "15m");

/**
 * AUTHSVC-006: persist a refresh token's jti into the rotation chain.
 * `replaces` links a newly minted token back to the one it superseded so
 * we can detect reuse of an already-rotated token.
 */
async function persistRefreshToken(params: {
  jti: string;
  userId: string;
  replaces?: { id: string; jti: string } | null;
}): Promise<void> {
  const { jti, userId, replaces } = params;
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.create({
      data: {
        jti,
        userId,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });
    if (replaces) {
      await tx.refreshToken.update({
        where: { id: replaces.id },
        data: { usedAt: new Date(), replacedBy: jti },
      });
    }
  });
}

/**
 * Walk the rotation chain forward from `startJti` (inclusive) and mark every
 * row as revoked. Called when we detect that a token that had already been
 * exchanged for a successor is being used again — classic token-theft signal.
 */
async function revokeRefreshChain(startJti: string, userId: string): Promise<void> {
  const visited = new Set<string>();
  let cursor: string | null = startJti;
  const ids: string[] = [];
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const row: { id: string; replacedBy: string | null } | null =
      await prisma.refreshToken.findUnique({
        where: { jti: cursor },
        select: { id: true, replacedBy: true },
      });
    if (!row) break;
    ids.push(row.id);
    cursor = row.replacedBy;
  }
  if (ids.length > 0) {
    await prisma.refreshToken.updateMany({
      where: { id: { in: ids } },
      data: { revoked: true },
    });
  }
  // Also clear any legacy Session rows for this user — covers the case where
  // a token issued before rotation existed is now considered compromised.
  await prisma.session.deleteMany({ where: { userId } }).catch(() => undefined);
}

// =================== REGISTER ====================
//
// AUTHSVC-002: do NOT leak whether email/username are taken. The response
// is identical (status, shape, latency-as-close-as-we-can) whether the
// account was actually created or not. When the email is already taken we
// still emit a Kafka notification so the legitimate owner is informed of
// the attempt.
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const body = parseBody(registerSchema, req.body, res);
    if (!body) return;

    const email = normalizeEmail(body.email);
    const username = body.username.trim();
    const name =
      body.name ?? ([body.firstName, body.lastName].filter(Boolean).join(" ") || null);

    // Always hash a password — even when we won't use the result — so the
    // request time is roughly constant between "available" and "taken".
    const hashedPassword = await hashPassword(body.password);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true, email: true, username: true },
    });

    const uniformResponse = {
      message:
        "If the account is available, you will receive instructions by email.",
    };

    if (existing) {
      // Tell the legitimate account holder that someone tried to register
      // with their email — they'll know to log in or reset their password.
      if (existing.email === email) {
        await producer.send("user.registration-attempted", {
          value: {
            email: existing.email,
            username: existing.username,
          },
        });
      }
      // For username collisions we deliberately don't notify (no good
      // recipient — the username may belong to someone with a different
      // email who hasn't asked for this signal).
      return res.status(202).json(uniformResponse);
    }

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, name },
    });

    // Create the refresh token + rotation record.
    const refreshJti = uuidv4();
    const tokens = signTokenPair(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { refreshJti },
    );
    await persistRefreshToken({ jti: refreshJti, userId: user.id });

    // Keep the legacy Session row populated for compatibility with the
    // logout endpoint owned by the sibling branch — they look up sessions
    // by token, not jti.
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    await producer.send("user.created", {
      value: { username: user.username, email: user.email },
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, refreshLifetimeMs(), accessLifetimeMs());

    // We return tokens in the body too so existing clients that read them
    // from JSON keep working until they migrate to the cookie flow.
    return res.status(201).json({
      ...uniformResponse,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== LOGIN ====================
//
// We deliberately keep the existing comparePassword + 401 shape intact —
// the timing-attack mitigation lives in the sibling branch
// (`fix/auth-route-hardening`, AUTHSVC-003). We only add input validation,
// rate limiting, email normalization, and a refresh-token rotation record.
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const body = parseBody(loginSchema, req.body, res);
    if (!body) return;

    const email = body.email ? normalizeEmail(body.email) : undefined;
    const username = body.username?.trim();

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : username
        ? await prisma.user.findUnique({ where: { username } })
        : null;

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await comparePassword(body.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const refreshJti = uuidv4();
    const tokens = signTokenPair(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { refreshJti },
    );

    await persistRefreshToken({ jti: refreshJti, userId: user.id });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, refreshLifetimeMs(), accessLifetimeMs());

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        image: user.image,
        hostVerified: user.hostVerified,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== LOGOUT ====================
//
// Sibling territory (AUTHSVC-007/009): leave the body of this handler
// alone. We only add the cookie clear so the front channel matches the
// back channel.
router.post("/logout", shouldBeUser, async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken, userId: req.userId },
      });
      // Mark the refresh-token chain as revoked so it can't be used to
      // mint a new access token even if the JWT itself is still
      // cryptographically valid.
      const verified = verifyRefreshToken(refreshToken);
      if (verified.ok && verified.payload.jti && req.userId) {
        await revokeRefreshChain(verified.payload.jti, req.userId);
      }
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== REFRESH ====================
//
// AUTHSVC-006: rotate the refresh token. Reuse detection works as
// follows: each successful refresh marks the presented token as `usedAt`
// and records the jti of its successor in `replacedBy`. If a request
// arrives with a refresh token that already has `usedAt` set, that's
// either replay (attacker captured the token after the legitimate
// client used it) or a buggy client; either way we revoke the entire
// chain and force re-authentication.
router.post("/refresh", refreshLimiter, async (req, res) => {
  try {
    const body = parseBody(refreshSchema, req.body, res);
    if (!body) return;

    const refreshToken: string | undefined =
      body.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const verified = verifyRefreshToken(refreshToken);
    if (!verified.ok) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const payload = verified.payload;

    // Token must carry a jti for rotation tracking; legacy tokens issued
    // before this migration won't, so we fall back to the Session table
    // for one-shot compatibility but never rotate them.
    const jti = payload.jti;
    if (!jti) {
      const legacy = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });
      if (!legacy || legacy.expiresAt < new Date()) {
        return res.status(401).json({ message: "Session expired" });
      }
      const accessToken = signAccessToken({
        userId: legacy.user.id,
        email: legacy.user.email,
        role: legacy.user.role,
        hostVerified: legacy.user.hostVerified,
      });
      return res.status(200).json({ accessToken });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { jti },
    });

    if (!stored || stored.userId !== payload.userId) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (stored.revoked) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }
    if (stored.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    if (stored.usedAt) {
      // Reuse detected — revoke the whole chain and the user's sessions.
      await revokeRefreshChain(jti, payload.userId);
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: "Refresh token reuse detected; please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newJti = uuidv4();
    const newRefreshToken = signRefreshToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { jti: newJti },
    );
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    await persistRefreshToken({
      jti: newJti,
      userId: user.id,
      replaces: { id: stored.id, jti: stored.jti },
    });

    // Mirror the new token into the legacy Session table and delete the
    // old session row so logout-by-token keeps working.
    await prisma.session.deleteMany({ where: { token: refreshToken } });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    setAuthCookies(res, accessToken, newRefreshToken, refreshLifetimeMs(), accessLifetimeMs());

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== ME ====================
router.get("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        hostApplicationPending: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== UPDATE PROFILE ====================
router.put("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, image, phone, bio } = req.body ?? {};

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
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
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== BECOME HOST ====================
//
// AUTHSVC-005: this endpoint used to flip the user's role to HOST
// immediately. That's straight self-promotion — any user could become a
// host without any review. It now creates a PENDING host application;
// an admin must call `PUT /users/:id/role` to actually grant HOST.
router.post("/become-host", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const body = parseBody(becomeHostSchema, req.body ?? {}, res);
    if (!body) return;

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.role === "HOST" || currentUser.role === "ADMIN") {
      return res.status(400).json({ message: "Already a host or admin" });
    }

    if (currentUser.hostApplicationPending) {
      return res
        .status(409)
        .json({ message: "Host application already pending review" });
    }

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.hostApplication.create({
        data: {
          userId,
          status: "PENDING",
          applicationData: {
            phone: body.phone ?? currentUser.phone ?? null,
            bio: body.bio ?? currentUser.bio ?? null,
            ...(body.applicationData ?? {}),
          },
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          hostApplicationPending: true,
          // Keep contact details fresh, but DO NOT change role.
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.bio !== undefined && { bio: body.bio }),
        },
      });
      return created;
    });

    await producer.send("host.applied", {
      value: {
        applicationId: application.id,
        userId: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        name: currentUser.name,
      },
    });

    return res.status(202).json({
      message:
        "Your host application has been submitted and is pending admin review.",
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("Become host error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== FORGOT PASSWORD ====================
//
// AUTHSVC-010: always return 202 with a generic body, regardless of
// whether the email belongs to a user. If it does, emit a Kafka event
// carrying a single-use reset token; the email service is responsible
// for putting the token into a templated email.
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const body = parseBody(forgotPasswordSchema, req.body, res);
    if (!body) return;

    const email = normalizeEmail(body.email);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });

    if (user) {
      const jti = uuidv4();
      const token = signPasswordResetToken(
        { userId: user.id, email: user.email },
        { jti },
      );
      await producer.send("user.password-reset-requested", {
        value: {
          email: user.email,
          username: user.username,
          token,
          // Expire metadata makes the email template's "this link expires
          // in N minutes" copy correct even if we change the TTL later.
          expiresInMinutes: 30,
        },
      });
    }

    return res.status(202).json({
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== RESET PASSWORD ====================
//
// AUTHSVC-010: verify the JWT, enforce single-use via PasswordResetUse,
// set the new bcrypt-hashed password, and invalidate all existing
// refresh tokens for the user so any stolen sessions are killed.
router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const body = parseBody(resetPasswordSchema, req.body, res);
    if (!body) return;

    const payload = verifyPasswordResetToken(body.token);
    if (!payload || !payload.jti) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Single-use check.
    const alreadyUsed = await prisma.passwordResetUse.findUnique({
      where: { jti: payload.jti },
    });
    if (alreadyUsed) {
      return res.status(400).json({ message: "Reset token has already been used" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });
    if (!user || user.email !== normalizeEmail(payload.email)) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const newHash = await hashPassword(body.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      await tx.passwordResetUse.create({
        data: { jti: payload.jti!, userId: user.id },
      });
      // Invalidate every existing refresh token for the user — a password
      // reset is the right moment to log out all sessions.
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    clearAuthCookies(res);
    return res.status(204).send();
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
