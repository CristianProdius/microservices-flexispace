import { FastifyInstance } from "fastify";
import {
  resolveActingHost,
  shouldBeAdmin,
  shouldBeHost,
} from "@repo/auth-middleware/fastify";
import { ListPayoutsQuerySchema } from "@repo/types";
import { prisma } from "@repo/db";
import { writeAudit } from "../utils/audit.js";
import { getStripe } from "../utils/stripe.js";

const actingHostId = (request: { userId?: string }): string =>
  ((request as any).actingHostId as string | undefined) ?? request.userId!;

const parsePayoutQuery = (query: unknown) => {
  const parsed = ListPayoutsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.issues };
  }
  return { ok: true as const, data: parsed.data };
};

const listPayouts = async (where: Record<string, unknown>, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            connectAccount: {
              select: {
                status: true,
                payoutsEnabled: true,
              },
            },
          },
        },
      },
    }),
    prisma.payout.count({ where }),
  ]);

  return {
    payouts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const payoutRoute = async (fastify: FastifyInstance) => {
  fastify.get(
    "/payouts",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const parsed = parsePayoutQuery(request.query);
      if (!parsed.ok) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: parsed.errors,
        });
      }

      const where = {
        ...(parsed.data.status && { status: parsed.data.status }),
        ...(parsed.data.hostId && { hostId: parsed.data.hostId }),
      };

      return reply.send(
        await listPayouts(where, parsed.data.page, parsed.data.limit)
      );
    }
  );

  fastify.get(
    "/payouts/host",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const parsed = parsePayoutQuery(request.query);
      if (!parsed.ok) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: parsed.errors,
        });
      }

      const where = {
        hostId: actingHostId(request),
        ...(parsed.data.status && { status: parsed.data.status }),
      };

      return reply.send(
        await listPayouts(where, parsed.data.page, parsed.data.limit)
      );
    }
  );

  fastify.post(
    "/payouts/:id/process",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payout = await prisma.payout.findUniqueOrThrow({
        where: { id },
        include: {
          host: {
            include: { connectAccount: true },
          },
        },
      });

      if (payout.netAmountMinor == null) {
        return reply.status(409).send({ code: "LEGACY_PAYOUT_NO_MINOR_AMOUNT" });
      }
      const netAmountMinor = payout.netAmountMinor;

      if (payout.host.connectAccount?.status !== "ACTIVE") {
        return reply.status(409).send({ code: "CONNECT_NOT_READY" });
      }

      const claim = await prisma.payout.updateMany({
        where: { id, status: { in: ["PENDING", "FAILED"] } },
        data: { status: "PROCESSING" },
      });
      if (claim.count === 0) {
        return reply.status(409).send({ code: "PAYOUT_NOT_CLAIMABLE" });
      }

      const key = payout.idempotencyKey ?? `transfer:${payout.id}`;
      const bookingId = payout.bookingIds[0];
      try {
        const transfer = await getStripe().transfers.create(
          {
            amount: payout.netAmountMinor,
            currency: payout.currency.toLowerCase(),
            destination: payout.host.connectAccount.stripeAccountId,
            transfer_group: bookingId ? `booking:${bookingId}` : undefined,
            metadata: { payoutId: payout.id },
          },
          { idempotencyKey: key }
        );

        const done = await prisma.$transaction(async (tx) => {
          const updated = await tx.payout.update({
            where: { id },
            data: {
              status: "COMPLETED",
              processedAt: new Date(),
              stripeTransferId: transfer.id,
              idempotencyKey: key,
            },
          });
          await writeAudit(tx, {
            payoutId: id,
            bookingId,
            actorType: "ADMIN",
            actorId: request.userId,
            action: "payout.transfer_created",
            amountMinor: netAmountMinor,
            currency: payout.currency,
            stripeObjectId: transfer.id,
          });
          return updated;
        });

        return reply.send(done);
      } catch (err: any) {
        await prisma.payout.update({
          where: { id },
          data: {
            status: "FAILED",
            failureReason: err?.message ?? String(err),
            idempotencyKey: key,
          },
        });
        return reply.status(502).send({
          code: "STRIPE_TRANSFER_FAILED",
          message: err?.message ?? String(err),
        });
      }
    }
  );
};
