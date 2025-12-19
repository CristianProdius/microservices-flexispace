import { prisma } from "@repo/db";
import { consumer } from "./kafka.js";

export const runKafkaSubscriptions = async () => {
  consumer.subscribe([
    {
      topicName: "deposit.paid",
      topicHandler: async (message) => {
        const { bookingId, stripePaymentId } = message.value;

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "DEPOSIT_PAID",
            depositPaid: true,
            depositPaidAt: new Date(),
            stripeDepositPaymentId: stripePaymentId,
          },
        });

        console.log(`Deposit paid for booking ${bookingId}`);
      },
    },
    {
      topicName: "remaining.paid",
      topicHandler: async (message) => {
        const { bookingId, stripePaymentId } = message.value;

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            remainingPaid: true,
            remainingPaidAt: new Date(),
            stripeRemainingPaymentId: stripePaymentId,
          },
        });

        console.log(`Remaining payment received for booking ${bookingId}`);
      },
    },
  ]);
};
