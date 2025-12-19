import { Hono } from "hono";
import Stripe from "stripe";
import stripe from "../utils/stripe.js";
import { producer } from "../utils/kafka.js";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const webhookRoute = new Hono();

webhookRoute.get("/", (c) => {
  return c.json({
    status: "ok webhook",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

webhookRoute.post("/stripe", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (error) {
    console.error("Webhook verification failed!");
    return c.json({ error: "Webhook verification failed!" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata?.bookingId || !metadata?.paymentType) {
        console.error("Missing metadata in session");
        break;
      }

      const { bookingId, paymentType } = metadata;
      const stripePaymentId = session.payment_intent as string;

      if (paymentType === "deposit") {
        // Deposit payment completed
        producer.send("deposit.paid", {
          value: {
            bookingId,
            stripePaymentId,
            amount: session.amount_total,
            customerEmail: session.customer_details?.email,
          },
        });
        console.log(`Deposit paid for booking ${bookingId}`);
      } else if (paymentType === "remaining") {
        // Remaining payment completed
        producer.send("remaining.paid", {
          value: {
            bookingId,
            stripePaymentId,
            amount: session.amount_total,
            customerEmail: session.customer_details?.email,
          },
        });
        console.log(`Remaining payment received for booking ${bookingId}`);
      }
      break;

    case "checkout.session.expired":
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      const expiredMetadata = expiredSession.metadata;

      if (expiredMetadata?.bookingId && expiredMetadata?.paymentType === "deposit") {
        producer.send("deposit.failed", {
          value: {
            bookingId: expiredMetadata.bookingId,
            reason: "Session expired",
          },
        });
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.error(`Payment failed: ${failedPayment.last_payment_error?.message}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return c.json({ received: true });
});

export default webhookRoute;
