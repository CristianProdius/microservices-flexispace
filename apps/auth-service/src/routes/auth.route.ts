import { Router, type Response } from "express";
import { prisma } from "@repo/db";
import {
  hashPassword,
  comparePassword,
  signTokenPair,
  verifyRefreshToken,
  signAccessToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  verifyAccessToken,
  extractTokenFromHeader,
} from "@repo/auth-middleware";
import { shouldBeUser } from "@repo/auth-middleware/express";
import { producer } from "../utils/kafka.js";

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

// ---------------------------------------------------------------------------
// AUTHSVC-003: constant-time login.
// When the user does not exist we still run bcrypt.compare against a known
// dummy hash so the timing of a "no such user" branch matches the timing of
// a "user exists, bad password" branch. The dummy hash is computed lazily
// once at first use to avoid blocking module load.
// ---------------------------------------------------------------------------
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = (): Promise<string> => {
  if (!dummyHashPromise) {
    // Hash a known string. The content doesn't matter — only the bcrypt cost.
    dummyHashPromise = hashPassword("__spacefly_timing_dummy__");
  }
  return dummyHashPromise;
};

// ---------------------------------------------------------------------------
// AUTHSVC-004: email verification.
// Enforce by default in production; toggleable via ENFORCE_EMAIL_VERIFICATION
// for environments where the email pipeline isn't wired up (local dev, CI).
// ---------------------------------------------------------------------------
const enforceEmailVerification = (): boolean => {
  const raw = process.env.ENFORCE_EMAIL_VERIFICATION;
  if (raw === undefined) {
    // Default: enforce in production, relax elsewhere.
    return process.env.NODE_ENV === "production";
  }
  return raw === "true" || raw === "1";
};

const sendVerificationEvent = (user: { id: string; email: string; username: string; name: string | null }) => {
  const token = signEmailVerificationToken({ userId: user.id, email: user.email });
  producer.send("user.email-verification-requested", {
    value: {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      token,
    },
  });
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username, and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
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
      },
    });

    // Generate tokens
    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "30d"))
      },
    });

    // Send Kafka event for user creation
    producer.send("user.created", {
      value: {
        username: user.username,
        email: user.email,
      },
    });

    // AUTHSVC-004: emit verification request so email-service can dispatch a
    // verification link. Token is single-use (JWT, purpose=email-verification).
    sendVerificationEvent(user);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        hostVerified: user.hostVerified,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user — note we still need to look up by email to compare the password.
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // AUTHSVC-003: always run bcrypt.compare so timing does not leak whether
    // an account exists. If the user is missing we compare against a dummy
    // hash and ignore the result.
    const hashToCompare = user?.password ?? (await getDummyHash());
    const isValidPassword = await comparePassword(password, hashToCompare);

    if (!user || !isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // AUTHSVC-004: block unverified emails when enforcement is on.
    if (!user.emailVerified && enforceEmailVerification()) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address has not been verified. Please check your inbox or request a new verification email.",
      });
    }

    // Generate tokens
    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "30d"))
      },
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        image: user.image,
        hostVerified: user.hostVerified,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
router.post("/logout", shouldBeUser, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Delete the session
      await prisma.session.deleteMany({
        where: { token: refreshToken, userId: req.userId },
      });
    }

    // AUTHSVC-007: revoke the access token the client is logging out with.
    // We re-extract+verify here (instead of trusting req.user) so we capture
    // the original jti and exp. Middleware has already established the token
    // is valid, but it discards the raw payload.
    const accessToken = extractTokenFromHeader(req.headers.authorization);
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload?.jti && payload.exp && req.userId) {
        const expiresAt = new Date(payload.exp * 1000);
        // Use upsert to be idempotent: a double-logout should not 500.
        await prisma.revokedAccessToken.upsert({
          where: { jti: payload.jti },
          update: {},
          create: {
            jti: payload.jti,
            userId: req.userId,
            expiresAt,
            reason: "logout",
          },
        });
      }
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    // Generate new access token
    const accessToken = signAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      hostVerified: session.user.hostVerified,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// AUTHSVC-004: verify-email — marks the user's email as verified.
// Token is a signed JWT with purpose=email-verification (24h TTL by default).
// Accepts both JSON POST and GET-with-query so a plain link in an email works.
// ---------------------------------------------------------------------------
const handleVerifyEmail = async (token: string | undefined, res: Response) => {
  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Verification token is required" });
  }

  const payload = verifyEmailVerificationToken(token);
  if (!payload) {
    return res.status(400).json({ message: "Verification token is invalid or expired" });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.email !== payload.email) {
    return res.status(400).json({ message: "Verification token is invalid or expired" });
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  return res.status(200).json({ message: "Email verified successfully", emailVerified: true });
};

router.get("/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  return handleVerifyEmail(token, res);
});

router.post("/verify-email", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : undefined;
  return handleVerifyEmail(token, res);
});

// ---------------------------------------------------------------------------
// AUTHSVC-004: resend-verification.
// Always returns 200 to avoid leaking which emails exist. If the address
// matches a user that isn't yet verified, we emit a fresh verification event.
// NOTE: a sibling branch (fix/auth-route-critical) is adding shared rate
// limiting; this endpoint should be wrapped by that middleware at merge time.
// ---------------------------------------------------------------------------
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      sendVerificationEvent(user);
    }

    return res.status(200).json({
      message: "If an account exists for that email and is not yet verified, a new verification message has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// AUTHSVC-009: change password (authenticated, requires currentPassword).
// On success we revoke the caller's current access token, delete all of the
// user's refresh sessions, and ask the client to re-login.
// ---------------------------------------------------------------------------
const MIN_PASSWORD_LENGTH = 8;

router.post("/change-password", shouldBeUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    if (newPassword === currentPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from the current password" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // bcrypt.compare is constant-time for hashes of equal cost.
    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newHash = await hashPassword(newPassword);

    // Apply the change, nuke all refresh sessions, and revoke the current
    // access token in a single transaction.
    const accessToken = extractTokenFromHeader(req.headers.authorization);
    const accessPayload = accessToken ? verifyAccessToken(accessToken) : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });

      await tx.session.deleteMany({ where: { userId: user.id } });

      if (accessPayload?.jti && accessPayload.exp) {
        await tx.revokedAccessToken.upsert({
          where: { jti: accessPayload.jti },
          update: {},
          create: {
            jti: accessPayload.jti,
            userId: user.id,
            expiresAt: new Date(accessPayload.exp * 1000),
            reason: "password-change",
          },
        });
      }
    });

    return res.status(200).json({
      message: "Password updated. Please log in again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user
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
        emailVerified: true,
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

// Update profile
router.put("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, image, phone, bio } = req.body;

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

// Request to become a host
router.post("/become-host", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, bio } = req.body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.role === "HOST" || currentUser.role === "ADMIN") {
      return res.status(400).json({ message: "Already a host or admin" });
    }

    // Update user to HOST role
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "HOST",
        phone: phone || currentUser.phone,
        bio: bio || currentUser.bio,
        hostingSince: new Date(),
        hostVerified: false, // Admin needs to verify
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
      },
    });

    // Send Kafka event
    producer.send("user.became-host", {
      value: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Generate new tokens with updated role
    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    return res.status(200).json({
      user,
      ...tokens,
      message: "Successfully became a host!",
    });
  } catch (error) {
    console.error("Become host error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
