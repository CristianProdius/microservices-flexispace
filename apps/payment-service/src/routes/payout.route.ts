import { Hono } from "hono";
import { shouldBeAdmin } from "@repo/auth-middleware/hono";
import { prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";
import { CreatePayoutSchema, ProcessPayoutSchema } from "@repo/types";

const payoutRoute = new Hono();

// Get all payouts (Admin)
payoutRoute.get("/", shouldBeAdmin, async (c) => {
  const status = c.req.query("status");
  const hostId = c.req.query("hostId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status: status as any }),
    ...(hostId && { hostId }),
  };

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payout.count({ where }),
  ]);

  return c.json({
    payouts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get payout details (Admin)
payoutRoute.get("/:id", shouldBeAdmin, async (c) => {
  const { id } = c.req.param();

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!payout) {
    return c.json({ error: "Payout not found" }, 404);
  }

  // Get booking details for this payout
  const bookings = await prisma.booking.findMany({
    where: {
      id: { in: payout.bookingIds },
    },
    include: {
      space: true,
      guest: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return c.json({ ...payout, bookings });
});

// Create payout (Admin)
payoutRoute.post("/", shouldBeAdmin, async (c) => {
  const body = await c.req.json();
  const result = CreatePayoutSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Validation failed", details: result.error.errors }, 400);
  }

  const { hostId, bookingIds } = result.data;

  // Verify bookings exist and belong to host
  const bookings = await prisma.booking.findMany({
    where: {
      id: { in: bookingIds },
      hostId,
      status: "COMPLETED",
    },
    include: {
      payout: true,
    },
  });

  if (bookings.length !== bookingIds.length) {
    return c.json({
      error: "Some bookings not found or not completed",
    }, 400);
  }

  // Check if any booking already has a payout
  const alreadyPaid = bookings.filter((b) => b.payoutId !== null);
  if (alreadyPaid.length > 0) {
    return c.json({
      error: "Some bookings already have payouts",
      bookingIds: alreadyPaid.map((b) => b.id),
    }, 400);
  }

  // Calculate amounts
  const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformFee = bookings.reduce((sum, b) => sum + b.serviceFee, 0);
  const netAmount = totalAmount - platformFee;

  // Create payout
  const payout = await prisma.payout.create({
    data: {
      hostId,
      amount: totalAmount,
      platformFee,
      netAmount,
      bookingIds,
      status: "PENDING",
    },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Link bookings to payout
  await prisma.booking.updateMany({
    where: { id: { in: bookingIds } },
    data: { payoutId: payout.id },
  });

  producer.send("payout.created", {
    value: {
      payoutId: payout.id,
      hostId,
      hostEmail: payout.host.email,
      netAmount,
    },
  });

  return c.json(payout, 201);
});

// Process payout (Admin)
payoutRoute.post("/:id/process", shouldBeAdmin, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const result = ProcessPayoutSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Validation failed" }, 400);
  }

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!payout) {
    return c.json({ error: "Payout not found" }, 404);
  }

  if (payout.status !== "PENDING" && payout.status !== "PROCESSING") {
    return c.json({ error: `Cannot process payout with status ${payout.status}` }, 400);
  }

  const { stripeTransferId } = result.data;

  // Update to processing first
  if (payout.status === "PENDING") {
    await prisma.payout.update({
      where: { id },
      data: { status: "PROCESSING" },
    });
  }

  // Mark as completed
  const updatedPayout = await prisma.payout.update({
    where: { id },
    data: {
      status: "COMPLETED",
      stripeTransferId: stripeTransferId || null,
      processedAt: new Date(),
    },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  producer.send("payout.processed", {
    value: {
      payoutId: id,
      hostId: payout.hostId,
      hostEmail: payout.host.email,
      netAmount: payout.netAmount,
    },
  });

  return c.json(updatedPayout);
});

// Mark payout as failed (Admin)
payoutRoute.post("/:id/fail", shouldBeAdmin, async (c) => {
  const { id } = c.req.param();
  const { reason } = await c.req.json();

  const payout = await prisma.payout.findUnique({
    where: { id },
  });

  if (!payout) {
    return c.json({ error: "Payout not found" }, 404);
  }

  if (payout.status === "COMPLETED") {
    return c.json({ error: "Cannot fail a completed payout" }, 400);
  }

  // Update payout status
  const updatedPayout = await prisma.payout.update({
    where: { id },
    data: {
      status: "FAILED",
    },
  });

  // Unlink bookings so they can be included in a new payout
  await prisma.booking.updateMany({
    where: { payoutId: id },
    data: { payoutId: null },
  });

  return c.json(updatedPayout);
});

// Get pending earnings for hosts (Admin view)
payoutRoute.get("/hosts/earnings", shouldBeAdmin, async (c) => {
  // Get completed bookings without payouts, grouped by host
  const pendingEarnings = await prisma.booking.groupBy({
    by: ["hostId"],
    where: {
      status: "COMPLETED",
      payoutId: null,
    },
    _sum: {
      totalAmount: true,
      serviceFee: true,
    },
    _count: true,
  });

  // Get host details
  const hostIds = pendingEarnings.map((e) => e.hostId);
  const hosts = await prisma.user.findMany({
    where: { id: { in: hostIds } },
    select: { id: true, name: true, email: true, image: true },
  });

  const result = pendingEarnings.map((e) => {
    const host = hosts.find((h) => h.id === e.hostId);
    return {
      host,
      pendingAmount: (e._sum.totalAmount || 0) - (e._sum.serviceFee || 0),
      platformFee: e._sum.serviceFee || 0,
      bookingCount: e._count,
    };
  });

  return c.json(result);
});

export default payoutRoute;
