import { Prisma, type Currency } from "@repo/db";

export type AuditActor = "GUEST" | "HOST" | "ADMIN" | "SYSTEM" | "STRIPE_WEBHOOK";

export interface AuditEntry {
  bookingId?: string;
  paymentId?: string;
  refundId?: string;
  payoutId?: string;
  actorType: AuditActor;
  actorId?: string;
  action: string;
  amountMinor?: number;
  currency?: Currency;
  stripeObjectId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append one financial audit row. MUST be called with the SAME transaction
 * client (`tx`) as the state change it records, so audit and state can never
 * disagree. Accepts the top-level prisma client only for read-only contexts.
 */
export const writeAudit = (
  tx: Prisma.TransactionClient,
  entry: AuditEntry
): Promise<unknown> =>
  tx.paymentAuditLog.create({
    data: {
      bookingId: entry.bookingId,
      paymentId: entry.paymentId,
      refundId: entry.refundId,
      payoutId: entry.payoutId,
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      amountMinor: entry.amountMinor,
      currency: entry.currency,
      stripeObjectId: entry.stripeObjectId,
      metadata: entry.metadata,
    },
  });
