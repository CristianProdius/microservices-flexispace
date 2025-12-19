import { Hono } from "hono";
import stripe from "../utils/stripe.js";
import { shouldBeUser } from "@repo/auth-middleware/hono";
import { prisma } from "@repo/db";

const sessionRoute = new Hono();

// Create deposit checkout session
sessionRoute.post("/deposit", shouldBeUser, async (c) => {
  const userId = c.get("userId");
  const { bookingId } = await c.req.json();

  // Get booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      space: true,
      guest: true,
    },
  });

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  if (booking.guestId !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  if (booking.status !== "APPROVED") {
    return c.json({ error: "Booking must be approved before paying deposit" }, 400);
  }

  if (booking.depositPaid) {
    return c.json({ error: "Deposit already paid" }, 400);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Deposit for ${booking.space.name}`,
              description: `Booking from ${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}`,
            },
            unit_amount: booking.depositAmount, // Already in cents
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      mode: "payment",
      ui_mode: "custom",
      return_url: `http://localhost:3002/bookings/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingId,
        paymentType: "deposit",
      },
    });

    return c.json({ checkoutSessionClientSecret: session.client_secret });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Create remaining payment checkout session
sessionRoute.post("/remaining", shouldBeUser, async (c) => {
  const userId = c.get("userId");
  const { bookingId } = await c.req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      space: true,
      guest: true,
    },
  });

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  if (booking.guestId !== userId) {
    return c.json({ error: "Not authorized" }, 403);
  }

  if (booking.status !== "DEPOSIT_PAID") {
    return c.json({ error: "Deposit must be paid first" }, 400);
  }

  if (booking.remainingPaid) {
    return c.json({ error: "Remaining balance already paid" }, 400);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Remaining Balance for ${booking.space.name}`,
              description: `Final payment for booking from ${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}`,
            },
            unit_amount: booking.remainingAmount,
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      mode: "payment",
      ui_mode: "custom",
      return_url: `http://localhost:3002/bookings/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingId,
        paymentType: "remaining",
      },
    });

    return c.json({ checkoutSessionClientSecret: session.client_secret });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Get session status
sessionRoute.get("/:session_id", async (c) => {
  const { session_id } = c.req.param();

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    return c.json({
      status: session.status,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });
  } catch (error) {
    return c.json({ error: "Session not found" }, 404);
  }
});

export default sessionRoute;
