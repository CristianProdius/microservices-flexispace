import { FastifyInstance } from "fastify";
import { shouldBeAdmin } from "@repo/auth-middleware/fastify";
import { ListPaymentsQuerySchema } from "@repo/types";
import { prisma } from "@repo/db";

const parsePaymentQuery = (query: unknown) => {
  const parsed = ListPaymentsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.issues };
  }
  return { ok: true as const, data: parsed.data };
};

export const paymentRoute = async (fastify: FastifyInstance) => {
  fastify.get(
    "/payments",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const parsed = parsePaymentQuery(request.query);
      if (!parsed.ok) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: parsed.errors,
        });
      }

      const where = {
        ...(parsed.data.status && { status: parsed.data.status }),
      };
      const skip = (parsed.data.page - 1) * parsed.data.limit;
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          take: parsed.data.limit,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            booking: {
              select: {
                id: true,
                status: true,
                guest: {
                  select: { id: true, name: true, email: true },
                },
                space: {
                  select: { id: true, name: true },
                },
              },
            },
            dispute: {
              select: {
                id: true,
                status: true,
                amountMinor: true,
                currency: true,
                reason: true,
              },
            },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      return reply.send({
        payments,
        pagination: {
          page: parsed.data.page,
          limit: parsed.data.limit,
          total,
          totalPages: Math.ceil(total / parsed.data.limit),
        },
      });
    }
  );
};
