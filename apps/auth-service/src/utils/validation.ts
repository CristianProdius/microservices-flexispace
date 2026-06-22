/**
 * AUTHSVC-011: zod schemas for auth endpoint request bodies.
 *
 * Validation is the FIRST thing each handler does, before any DB call,
 * so that 400 responses on malformed input never reach Prisma and never
 * leak existence information through error-shape differences.
 */
import { z } from "zod";
import type { Response } from "express";

const emailSchema = z
  .string()
  .trim()
  .min(3, "email is required")
  .max(254, "email is too long")
  .email("email is not a valid email address");

const usernameSchema = z
  .string()
  .trim()
  .min(3, "username must be at least 3 characters")
  .max(32, "username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "username may only contain letters, digits, and underscore");

// bcrypt truncates at 72 bytes and hashPassword throws above that, so 72 is
// a hard upper bound. Every consumer of this schema (register, reset,
// onboarding set-password, accept-invite) feeds the value into hashPassword,
// so capping here keeps an over-long password a friendly 400 instead of a 500.
const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(72, "password is too long");

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional(),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema.optional(),
    username: z.string().trim().min(1).max(64).optional(),
    password: z.string().min(1, "password is required").max(256),
  })
  .refine((data) => Boolean(data.email || data.username), {
    message: "email or username is required",
    path: ["email"],
  });
export type LoginBody = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  // Cookie is the preferred source post wave-2; body is accepted as fallback.
  refreshToken: z.string().min(20).max(4096).optional(),
});
export type RefreshBody = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(4096),
  newPassword: passwordSchema,
});
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const onboardingSetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type OnboardingSetPasswordBody = z.infer<typeof onboardingSetPasswordSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(4096),
  newPassword: passwordSchema,
});
export type AcceptInviteBody = z.infer<typeof acceptInviteSchema>;

export const hostInviteSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  email: emailSchema,
});
export type HostInviteBody = z.infer<typeof hostInviteSchema>;

export const becomeHostSchema = z.object({
  phone: z.string().trim().min(1).max(40).optional(),
  bio: z.string().trim().max(2000).optional(),
  applicationData: z.record(z.string(), z.unknown()).optional(),
});
export type BecomeHostBody = z.infer<typeof becomeHostSchema>;

/**
 * Run a zod schema against `req.body` and either return the parsed value or
 * write a uniform 400 response and return `null`.
 */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
  res: Response,
): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    res.status(400).json({ message: "Invalid request", issues });
    return null;
  }
  return result.data;
}
