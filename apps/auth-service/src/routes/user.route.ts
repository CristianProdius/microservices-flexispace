import { Router } from "express";
import { prisma, Role } from "@repo/db";
import { hashPassword } from "@repo/auth-middleware";
import { producer } from "../utils/kafka.js";
import { sendPrismaError } from "../utils/prismaErrors.js";

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

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    const parsedRole = parseOptionalRole(role);
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const users = await prisma.user.findMany({
      where: parsedRole ? { role: parsedRole } : undefined,
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
    return sendPrismaError(res, error, "Get hosts error");
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
    return sendPrismaError(res, error, "Get user error");
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

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return res.status(400).json({ message: pwCheck.message });
    }

    // Check if user already exists (defence-in-depth; Prisma P2002 handler also covers race)
    const existingUser = await prisma.user.findFirst({
      where: {
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

    // Send Kafka event
    producer.send("user.created", {
      value: {
        username: user.username,
        email: user.email,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    return sendPrismaError(res, error, "Create user error");
  }
});

// Update user (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, name, role, image, password } = req.body;
    const parsedRole = parseOptionalRole(role);
    if (parsedRole === null) {
      return res.status(400).json({ message: "Invalid role" });
    }

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

// Delete user (admin only)
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

    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: "User deleted successfully" });
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

    // Last-admin guard: if we're demoting the target away from ADMIN and they
    // are currently the only admin, refuse.
    if (parsedRole !== "ADMIN") {
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
            .json({ message: "Cannot demote the last remaining admin" });
        }
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

export default router;
