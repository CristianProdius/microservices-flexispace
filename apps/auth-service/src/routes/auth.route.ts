import { Router } from "express";
import { prisma } from "@repo/db";
import {
  hashPassword,
  comparePassword,
  signTokenPair,
  verifyRefreshToken,
  signAccessToken,
} from "@repo/auth-middleware";
import { shouldBeUser } from "@repo/auth-middleware/express";
import { producer } from "../utils/kafka.js";

const router: Router = Router();

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
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send Kafka event for user creation
    producer.send("user.created", {
      value: {
        username: user.username,
        email: user.email,
      },
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
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
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        where: { token: refreshToken },
      });
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
