import { Router, type CookieOptions, type Response } from "express";
import { prisma } from "@repo/db";
import {
  hashPassword,
  comparePassword,
  signTokenPair,
  verifyRefreshToken,
  signAccessToken,
  InvalidPasswordError,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  extractTokenFromCookieHeader,
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

/**
 * Build the base options shared by the access- and refresh-token cookies.
 * `Secure` is enabled in production only so localhost dev (which is plain
 * HTTP) keeps working; `SameSite=Strict` blocks cross-site CSRF. Cookies
 * are HttpOnly so they are unreachable from JavaScript / XSS.
 */
function baseCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: parseExpiry(process.env.JWT_EXPIRES_IN || "15m"),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    // Refresh tokens are only used by /auth/refresh and /auth/logout.
    // Both live under /auth so we keep the cookie path narrow.
    path: "/auth",
    maxAge: parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "30d"),
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions() });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseCookieOptions(), path: "/auth" });
}

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username, and password are required" });
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

    // Send Kafka event for user creation.
    // The user row is already committed; do not fail registration if the
    // event publish fails (welcome email is best-effort, not critical to
    // account creation).
    // TODO(KAFKA-001 follow-up): transactional outbox so user.created is
    // guaranteed to be published exactly once after the DB write.
    try {
      await producer.send("user.created", {
        value: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (err) {
      console.error(
        "Failed to publish user.created event for",
        user.id,
        "- account created but welcome email will not fire:",
        err instanceof Error ? err.message : err
      );
    }

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
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
    if (error instanceof InvalidPasswordError) {
      return res.status(400).json({ message: error.message });
    }
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

    // Find user (soft-deleted accounts can never log in).
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
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

    // Set HttpOnly session cookies (primary mechanism going forward) and
    // also return tokens in the JSON body so existing API clients that
    // still send `Authorization: Bearer ...` keep working during the
    // transition.
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

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

// Logout
router.post("/logout", shouldBeUser, async (req, res) => {
  try {
    const refreshToken =
      req.body?.refreshToken ||
      extractTokenFromCookieHeader(req.headers.cookie, REFRESH_TOKEN_COOKIE);

    if (refreshToken) {
      // Delete the session
      await prisma.session.deleteMany({
        where: { token: refreshToken, userId: req.userId },
      });
    }

    clearAuthCookies(res);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken =
      req.body?.refreshToken ||
      extractTokenFromCookieHeader(req.headers.cookie, REFRESH_TOKEN_COOKIE);

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const result = verifyRefreshToken(refreshToken);

    if (!result.ok) {
      const message =
        result.reason === "expired"
          ? "Refresh token expired"
          : result.reason === "wrong_token_use"
            ? "Wrong token type"
            : "Invalid refresh token";
      return res.status(401).json({ message });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    // Block refresh for soft-deleted accounts (admin DELETE also wipes
    // sessions, so this is a belt-and-braces check).
    if (session.user.deletedAt !== null) {
      return res.status(401).json({ message: "Session expired" });
    }

    // Generate new access token
    const accessToken = signAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      hostVerified: session.user.hostVerified,
    });

    // Refresh the access-token cookie. We don't rotate the refresh token
    // here (matches the previous behaviour), so the refresh cookie is left
    // untouched.
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookieOptions(),
      maxAge: parseExpiry(process.env.JWT_EXPIRES_IN || "15m"),
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user
router.get("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
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

    const existing = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

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
    const currentUser = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
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

    // Send Kafka event.
    // The role transition is already persisted; do not fail the request if
    // the event publish fails (downstream host-onboarding email/notification
    // can be reconciled out-of-band).
    // TODO(KAFKA-001 follow-up): transactional outbox.
    try {
      await producer.send("user.became-host", {
        value: {
          userId: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      console.error(
        "Failed to publish user.became-host event for",
        user.id,
        "- role updated but onboarding notification will not fire:",
        err instanceof Error ? err.message : err
      );
    }

    // Generate new tokens with updated role
    const tokens = signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

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
