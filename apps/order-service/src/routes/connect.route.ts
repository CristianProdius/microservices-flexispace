import { FastifyInstance } from "fastify";
import {
  resolveActingHost,
  shouldBeHost,
} from "@repo/auth-middleware/fastify";
import { CreateConnectAccountSchema } from "@repo/types";
import { prisma } from "@repo/db";
import { getStripe } from "../utils/stripe.js";

const actingHostId = (request: { userId?: string }): string =>
  ((request as any).actingHostId as string | undefined) ?? request.userId!;

const requirementsDue = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const connectResponse = (row: {
  stripeAccountId: string;
  status: string;
  payoutsEnabled: boolean;
}) => ({
  stripeAccountId: row.stripeAccountId,
  status: row.status,
  payoutsEnabled: row.payoutsEnabled,
});

export const connectRoute = async (fastify: FastifyInstance) => {
  fastify.post(
    "/connect/account",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const userId = actingHostId(request);
      const existing = await prisma.stripeConnectAccount.findUnique({
        where: { userId },
      });
      if (existing) {
        return reply.send(connectResponse(existing));
      }

      const parsed = CreateConnectAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: parsed.error.issues,
        });
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const account = await getStripe().accounts.create({
        type: "express",
        country: parsed.data.country,
        email: user.email,
        capabilities: { transfers: { requested: true } },
        metadata: { spaceflyUserId: userId },
      });
      const row = await prisma.stripeConnectAccount.create({
        data: {
          userId,
          stripeAccountId: account.id,
          status: "ONBOARDING",
        },
      });
      await prisma.paymentAuditLog.create({
        data: {
          actorType: "HOST",
          actorId: userId,
          action: "connect.account_created",
          stripeObjectId: account.id,
        },
      });
      return reply.status(201).send(connectResponse(row));
    }
  );

  fastify.post(
    "/connect/account-link",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const userId = actingHostId(request);
      const account = await prisma.stripeConnectAccount.findUnique({
        where: { userId },
      });
      if (!account) {
        return reply.status(409).send({
          code: "CONNECT_ACCOUNT_NOT_FOUND",
          message: "Connect account not found",
        });
      }

      const refreshUrl = process.env.CONNECT_REFRESH_URL;
      const returnUrl = process.env.CONNECT_RETURN_URL;
      if (!refreshUrl || !returnUrl) {
        return reply.status(500).send({
          message: "Connect return and refresh URLs are not configured",
        });
      }

      const link = await getStripe().accountLinks.create({
        account: account.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });

      return reply.status(201).send({
        url: link.url,
        expiresAt: link.expires_at,
      });
    }
  );

  fastify.get(
    "/connect/status",
    { preHandler: [shouldBeHost, resolveActingHost] },
    async (request, reply) => {
      const userId = actingHostId(request);
      const account = await prisma.stripeConnectAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        return reply.send({
          exists: false,
          status: null,
          payoutsEnabled: false,
          detailsSubmitted: false,
          requirementsDue: [],
        });
      }

      return reply.send({
        exists: true,
        status: account.status,
        payoutsEnabled: account.payoutsEnabled,
        detailsSubmitted: account.detailsSubmitted,
        requirementsDue: requirementsDue(account.requirementsDue),
      });
    }
  );
};
