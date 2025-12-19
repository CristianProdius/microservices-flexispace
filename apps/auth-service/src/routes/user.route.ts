import { Router } from "express";
import { prisma } from "@repo/db";
import { hashPassword } from "@repo/auth-middleware";
import { producer } from "../utils/kafka.js";

const router: Router = Router();

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
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

    const user = await prisma.user.findUnique({
      where: { id },
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
        role: role || "USER",
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(username && { username }),
        ...(name !== undefined && { name }),
        ...(role && { role }),
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: "User deleted successfully" });
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

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!["USER", "HOST", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        ...(role === "HOST" && { hostingSince: new Date() }),
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
