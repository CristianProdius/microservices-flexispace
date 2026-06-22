import { Router, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@repo/db";
import {
  hashPassword,
  comparePassword,
  signTokenPair,
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  verifyAccessToken,
  extractTokenFromHeader,
  normalizeEmail,
} from "@repo/auth-middleware";
import { shouldBeUser } from "@repo/auth-middleware/express";
import { producer } from "../utils/kafka.js";
import { hashInviteToken } from "../utils/inviteToken.js";
import {
  parseBody,
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSetPasswordSchema,
  becomeHostSchema,
  acceptInviteSchema,
} from "../utils/validation.js";
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  onboardingSetPasswordLimiter,
  resendVerificationLimiter,
  acceptInviteLimiter,
} from "../utils/rateLimit.js";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
} from "../utils/cookies.js";

const router: Router = Router();

/** Convert a duration string like "30d", "1h", "15m", "30s" to milliseconds. */
function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const value = parseInt(match[1]!, 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

const refreshLifetimeMs = () =>
  parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "30d");

const accessLifetimeMs = () =>
  parseExpiry(process.env.JWT_EXPIRES_IN || "15m");

// ---------------------------------------------------------------------------
// AUTHSVC-003: constant-time login.
// When the user does not exist we still run bcrypt.compare against a known
// dummy hash so the timing of a "no such user" branch matches the timing of
// a "user exists, bad password" branch. The dummy hash is computed lazily
// once at first use to avoid blocking module load.
// ---------------------------------------------------------------------------
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = (): Promise<string> => {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("__spacefly_timing_dummy__");
  }
  return dummyHashPromise;
};

// ---------------------------------------------------------------------------
// AUTHSVC-004: email verification gate.
// Enforce by default in production; toggleable via ENFORCE_EMAIL_VERIFICATION
// for environments where the email pipeline isn't wired up (local dev, CI).
// ---------------------------------------------------------------------------
const enforceEmailVerification = (): boolean => {
  const raw = process.env.ENFORCE_EMAIL_VERIFICATION;
  if (raw === undefined) {
    return process.env.NODE_ENV === "production";
  }
  return raw === "true" || raw === "1";
};

// AUD-002: this used to fire `producer.send` without awaiting, so a Kafka
// outage just dropped verification emails silently (the handler returned
// 201 to the user but no event ever got produced — verification links
// would never arrive). Now async + awaited + try/catch so we surface the
// failure to the caller's catch and log it for ops.
const sendVerificationEvent = async (user: {
  id: string;
  email: string;
  username: string;
  name: string | null;
}): Promise<void> => {
  const token = signEmailVerificationToken({ userId: user.id, email: user.email });
  try {
    await producer.send("user.email-verification-requested", {
      value: {
        userId: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        token,
      },
    });
  } catch (err) {
    console.error("verification event send failed", err);
  }
};

/**
 * AUTHSVC-006: persist a refresh token's jti into the rotation chain.
 * `replaces` links a newly minted token back to the one it superseded so
 * we can detect reuse of an already-rotated token.
 */
async function persistRefreshToken(params: {
  jti: string;
  userId: string;
  replaces?: { id: string; jti: string } | null;
}): Promise<void> {
  const { jti, userId, replaces } = params;
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.create({
      data: {
        jti,
        userId,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });
    if (replaces) {
      await tx.refreshToken.update({
        where: { id: replaces.id },
        data: { usedAt: new Date(), replacedBy: jti },
      });
    }
  });
}

/**
 * Walk the rotation chain forward from `startJti` (inclusive) and mark every
 * row as revoked. Called when we detect that a token that had already been
 * exchanged for a successor is being used again — classic token-theft signal.
 */
async function revokeRefreshChain(startJti: string, userId: string): Promise<void> {
  const visited = new Set<string>();
  let cursor: string | null = startJti;
  const ids: string[] = [];
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const row: { id: string; replacedBy: string | null } | null =
      await prisma.refreshToken.findUnique({
        where: { jti: cursor },
        select: { id: true, replacedBy: true },
      });
    if (!row) break;
    ids.push(row.id);
    cursor = row.replacedBy;
  }
  if (ids.length > 0) {
    await prisma.refreshToken.updateMany({
      where: { id: { in: ids } },
      data: { revoked: true },
    });
  }
  // Also clear any legacy Session rows for this user — covers the case where
  // a token issued before rotation existed is now considered compromised.
  await prisma.session.deleteMany({ where: { userId } }).catch(() => undefined);
}

// =================== REGISTER ====================
//
// AUTHSVC-002: do NOT leak whether email/username are taken. The response
// is identical (status, shape, latency-as-close-as-we-can) whether the
// account was actually created or not. When the email is already taken we
// still emit a Kafka notification so the legitimate owner is informed of
// the attempt.
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const body = parseBody(registerSchema, req.body, res);
    if (!body) return;

    const email = normalizeEmail(body.email);
    const username = body.username.trim();
    const name =
      body.name ?? ([body.firstName, body.lastName].filter(Boolean).join(" ") || null);

    // Always hash a password — even when we won't use the result — so the
    // request time is roughly constant between "available" and "taken".
    const hashedPassword = await hashPassword(body.password);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true, email: true, username: true },
    });

    const uniformResponse = {
      message:
        "If the account is available, you will receive instructions by email.",
    };

    if (existing) {
      // Tell the legitimate account holder that someone tried to register
      // with their email — they'll know to log in or reset their password.
      if (existing.email === email) {
        await producer.send("user.registration-attempted", {
          value: {
            email: existing.email,
            username: existing.username,
          },
        });
      }
      // For username collisions we deliberately don't notify (no good
      // recipient — the username may belong to someone with a different
      // email who hasn't asked for this signal).
      return res.status(202).json(uniformResponse);
    }

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, name },
    });

    // Create the refresh token + rotation record.
    const refreshJti = uuidv4();
    const tokens = signTokenPair(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { refreshJti },
    );
    await persistRefreshToken({ jti: refreshJti, userId: user.id });

    // Keep the legacy Session row populated for compatibility with the
    // logout endpoint owned by the sibling branch — they look up sessions
    // by token, not jti.
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    await producer.send("user.created", {
      value: { username: user.username, email: user.email },
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, refreshLifetimeMs(), accessLifetimeMs());

    // AUTHSVC-004: emit verification request so email-service can dispatch a
    // verification link. Token is single-use (JWT, purpose=email-verification).
    // AUD-002: awaited; the helper swallows its own send errors so this can
    // never reject and we always return a 201 to a successfully-created user.
    await sendVerificationEvent(user);

    // We return tokens in the body too so existing clients that read them
    // from JSON keep working until they migrate to the cookie flow.
    return res.status(201).json({
      ...uniformResponse,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        hostVerified: user.hostVerified,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Public: validate an invite token so the accept page can render the
// invitee's email/name (or a friendly "no longer valid" state).
// No auth — the user is not logged in yet.
router.get("/invite/:token", async (req, res) => {
  try {
    const raw = req.params.token ?? "";
    if (!raw || raw.length < 20 || raw.length > 4096) {
      return res.status(200).json({ valid: false, reason: "INVALID" });
    }

    const tokenHash = hashInviteToken(raw);
    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
      select: {
        email: true,
        acceptedAt: true,
        expiresAt: true,
        user: { select: { name: true, deletedAt: true } },
      },
    });

    if (!invite || invite.user.deletedAt) {
      return res.status(200).json({ valid: false, reason: "INVALID" });
    }
    if (invite.acceptedAt) {
      return res.status(200).json({ valid: false, reason: "ALREADY_ACCEPTED" });
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      return res.status(200).json({ valid: false, reason: "EXPIRED" });
    }

    return res.status(200).json({
      valid: true,
      email: invite.email,
      name: invite.user.name ?? undefined,
    });
  } catch (error) {
    console.error("Invite validate error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== LOGIN ====================
//
// We deliberately keep the existing comparePassword + 401 shape intact —
// the timing-attack mitigation lives in the sibling branch
// (`fix/auth-route-hardening`, AUTHSVC-003). We only add input validation,
// rate limiting, email normalization, and a refresh-token rotation record.
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const body = parseBody(loginSchema, req.body, res);
    if (!body) return;

    const email = body.email ? normalizeEmail(body.email) : undefined;
    const username = body.username?.trim();

    // findFirst (not findUnique) so we can apply the deletedAt filter — a
    // soft-deleted user must not be able to authenticate even if their email
    // happens to still be unique among deleted rows.
    const user = email
      ? await prisma.user.findFirst({ where: { email, deletedAt: null } })
      : username
        ? await prisma.user.findFirst({ where: { username, deletedAt: null } })
        : null;

    // AUTHSVC-003: always run bcrypt.compare so timing does not leak whether
    // an account exists. If the user is missing we compare against a dummy
    // hash and ignore the result.
    const hashToCompare = user?.password ?? (await getDummyHash());
    const isValidPassword = await comparePassword(body.password, hashToCompare);

    if (!user || !isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // AUTHSVC-004: block unverified emails when enforcement is on.
    if (!user.emailVerified && enforceEmailVerification()) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address has not been verified. Please check your inbox or request a new verification email.",
      });
    }

    const refreshJti = uuidv4();
    const tokens = signTokenPair(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { refreshJti },
    );

    await persistRefreshToken({ jti: refreshJti, userId: user.id });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, refreshLifetimeMs(), accessLifetimeMs());

    // AUTHSVC-014: admin-provisioned accounts (or any account flagged for
    // rotation) must be redirected to the change-password flow.
    const requiresPasswordChange = user.mustChangePassword === true;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        image: user.image,
        hostVerified: user.hostVerified,
        emailVerified: user.emailVerified,
      },
      ...tokens,
      requiresPasswordChange,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== LOGOUT ====================
//
// AUD-028: logout MUST be reachable with only a refresh token (the access
// token typically expires well before the refresh chain does, and the
// browser may have already discarded the access cookie). Previously this
// was gated by `shouldBeUser`, which 401'd on expired access tokens — so
// the client could not revoke the refresh chain and the session lived on.
//
// New contract:
//   - The refresh token (body or cookie) is the source of truth for who
//     is logging out.
//   - When present, we verify it (slight clock skew is acceptable for
//     logout), use its payload.userId, revoke the refresh chain, drop
//     the Session row, and — if an access token was also sent — revoke
//     that token's jti.
//   - When absent, we still clear cookies and return 200. Logout is
//     idempotent; the caller cannot rely on "already logged out" being
//     an error.
router.post("/logout", async (req, res) => {
  try {
    const refreshToken: string | undefined =
      req.body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];

    let resolvedUserId: string | undefined;
    let refreshJti: string | undefined;

    if (refreshToken) {
      const verified = verifyRefreshToken(refreshToken);
      // For logout we accept "expired" too — the user clearly intends to
      // sign out; refusing because the cookie is stale would leave the
      // server-side revocation undone. We only reject genuinely invalid
      // (forged / malformed) tokens.
      if (verified.ok) {
        resolvedUserId = verified.payload.userId;
        refreshJti = verified.payload.jti;
      } else if (verified.reason === "expired") {
        // jsonwebtoken throws before returning the payload on expiry, so we
        // can't recover the userId from a stale token without an unsafe
        // decode. Fall back to deleting the Session row by token below.
      }

      // Drop the legacy Session row keyed by the token regardless of the
      // verify result so a token whose signing secret has since rotated
      // still gets cleaned up.
      await prisma.session.deleteMany({ where: { token: refreshToken } });

      if (refreshJti && resolvedUserId) {
        await revokeRefreshChain(refreshJti, resolvedUserId);
      }
    }

    clearAuthCookies(res);

    // AUTHSVC-007: revoke the access token the client is logging out with,
    // when we have one. Independent of refresh-token revocation above.
    const accessToken = extractTokenFromHeader(req.headers.authorization);
    if (accessToken) {
      const verified = verifyAccessToken(accessToken);
      if (
        verified.ok &&
        verified.payload.jti &&
        verified.payload.exp &&
        (resolvedUserId || verified.payload.userId)
      ) {
        const expiresAt = new Date(verified.payload.exp * 1000);
        const userId = resolvedUserId ?? verified.payload.userId;
        // Use upsert to be idempotent: a double-logout should not 500.
        await prisma.revokedAccessToken.upsert({
          where: { jti: verified.payload.jti },
          update: {},
          create: {
            jti: verified.payload.jti,
            userId,
            expiresAt,
            reason: "logout",
          },
        });
      }
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== REFRESH ====================
//
// AUTHSVC-006: rotate the refresh token. Reuse detection works as
// follows: each successful refresh marks the presented token as `usedAt`
// and records the jti of its successor in `replacedBy`. If a request
// arrives with a refresh token that already has `usedAt` set, that's
// either replay (attacker captured the token after the legitimate
// client used it) or a buggy client; either way we revoke the entire
// chain and force re-authentication.
router.post("/refresh", refreshLimiter, async (req, res) => {
  try {
    const body = parseBody(refreshSchema, req.body, res);
    if (!body) return;

    const refreshToken: string | undefined =
      body.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const verified = verifyRefreshToken(refreshToken);
    if (!verified.ok) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const payload = verified.payload;

    // Token must carry a jti for rotation tracking; legacy tokens issued
    // before this migration won't, so we fall back to the Session table
    // for one-shot compatibility but never rotate them.
    const jti = payload.jti;
    if (!jti) {
      const legacy = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });
      if (!legacy || legacy.expiresAt < new Date()) {
        return res.status(401).json({ message: "Session expired" });
      }
      const accessToken = signAccessToken({
        userId: legacy.user.id,
        email: legacy.user.email,
        role: legacy.user.role,
        hostVerified: legacy.user.hostVerified,
      });
      return res.status(200).json({ accessToken });
    }

    // AUD-027: atomic claim. The previous implementation read `stored`
    // then later wrote `usedAt = now` in a separate statement, so two
    // concurrent requests with the same refresh token could both pass
    // the `stored.usedAt == null` check, both mint successors, and then
    // a third request with the original token would be flagged as
    // "reuse" and revoke the entire chain — logging the user out across
    // every tab/app sharing the .spacefly.ai cookie. The fix is a
    // single conditional `updateMany`: only the request that flips
    // `usedAt` from null to now is allowed to rotate. Anyone else gets
    // a benign 409 RACE response.
    const now = new Date();
    const claim = await prisma.refreshToken.updateMany({
      where: {
        jti,
        userId: payload.userId,
        usedAt: null,
        revoked: false,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (claim.count === 0) {
      // The claim failed. Re-read to figure out why so we return the
      // right error code without revoking the chain on a legitimate
      // race.
      const stored = await prisma.refreshToken.findUnique({ where: { jti } });

      if (!stored || stored.userId !== payload.userId) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      if (stored.revoked) {
        return res.status(401).json({ message: "Refresh token revoked" });
      }
      if (stored.expiresAt < now) {
        return res.status(401).json({ message: "Refresh token expired" });
      }

      // usedAt is set. Distinguish a recent concurrent rotation (race)
      // from a stale reuse attempt (theft). A token that was rotated
      // within the last few seconds is almost certainly a race — the
      // browser already has the winning request's Set-Cookie applied,
      // so the client just needs to retry and the new cookie will be
      // sent on the next attempt. A token that was rotated long ago is
      // suspicious and warrants revoking the chain (which is what the
      // old code did unconditionally).
      const REFRESH_RACE_WINDOW_MS = 10_000;
      const rotatedAt = stored.usedAt?.getTime() ?? 0;
      if (stored.replacedBy && now.getTime() - rotatedAt < REFRESH_RACE_WINDOW_MS) {
        return res.status(409).json({
          code: "REFRESH_RACE",
          message:
            "Refresh token already rotated by a concurrent request; retry with the new cookie.",
        });
      }

      // Stale rotation → likely real reuse. Revoke the chain as before.
      await revokeRefreshChain(jti, payload.userId);
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: "Refresh token reuse detected; please log in again." });
    }

    // We won the claim. From here on we're the sole rotator for this jti.
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
    });
    if (!user) {
      // Either the user vanished or was soft-deleted — refuse to rotate so the
      // refresh chain dies with the account.
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newJti = uuidv4();
    const newRefreshToken = signRefreshToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hostVerified: user.hostVerified,
      },
      { jti: newJti },
    );
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      hostVerified: user.hostVerified,
    });

    // Mint the new token row and link the old → new. We already set
    // `usedAt` above via the atomic claim, so this transaction only
    // needs to (a) create the successor and (b) record replacedBy on
    // the parent.
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          jti: newJti,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshLifetimeMs()),
        },
      }),
      prisma.refreshToken.update({
        where: { jti },
        data: { replacedBy: newJti },
      }),
    ]);

    // Mirror the new token into the legacy Session table and delete the
    // old session row so logout-by-token keeps working.
    await prisma.session.deleteMany({ where: { token: refreshToken } });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + refreshLifetimeMs()),
      },
    });

    setAuthCookies(res, accessToken, newRefreshToken, refreshLifetimeMs(), accessLifetimeMs());

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// AUTHSVC-004: verify-email — marks the user's email as verified.
// Token is a signed JWT with purpose=email-verification (24h TTL by default).
// Accepts both JSON POST and GET-with-query so a plain link in an email works.
// ---------------------------------------------------------------------------
const handleVerifyEmail = async (token: string | undefined, res: Response) => {
  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Verification token is required" });
  }

  const payload = verifyEmailVerificationToken(token);
  if (!payload) {
    return res.status(400).json({ message: "Verification token is invalid or expired" });
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null },
  });
  if (!user || user.email !== payload.email) {
    return res.status(400).json({ message: "Verification token is invalid or expired" });
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  return res.status(200).json({ message: "Email verified successfully", emailVerified: true });
};

router.get("/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  return handleVerifyEmail(token, res);
});

router.post("/verify-email", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : undefined;
  return handleVerifyEmail(token, res);
});

// ---------------------------------------------------------------------------
// AUTHSVC-004: resend-verification.
// Always returns 200 to avoid leaking which emails exist. If the address
// matches a user that isn't yet verified, we emit a fresh verification event.
// AUD-029: gated behind resendVerificationLimiter so mailbomb attempts and
// runaway clients are shed at the edge.
// ---------------------------------------------------------------------------
router.post("/resend-verification", resendVerificationLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (user && !user.emailVerified) {
      // AUD-002: awaited; the helper logs + swallows its own send errors so
      // we keep the uniform 200 response regardless of Kafka health.
      await sendVerificationEvent(user);
    }

    return res.status(200).json({
      message: "If an account exists for that email and is not yet verified, a new verification message has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// AUTHSVC-009: change password (authenticated, requires currentPassword).
// On success we revoke the caller's current access token, delete all of the
// user's refresh sessions, and ask the client to re-login.
// ---------------------------------------------------------------------------
const MIN_PASSWORD_LENGTH = 8;

router.post("/change-password", shouldBeUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    if (newPassword === currentPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from the current password" });
    }

    const user = await prisma.user.findFirst({
      where: { id: req.userId, deletedAt: null },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // bcrypt.compare is constant-time for hashes of equal cost.
    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newHash = await hashPassword(newPassword);

    // Apply the change, nuke all refresh sessions, and revoke the current
    // access token in a single transaction.
    const accessToken = extractTokenFromHeader(req.headers.authorization);
    const accessVerified = accessToken ? verifyAccessToken(accessToken) : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });

      await tx.session.deleteMany({ where: { userId: user.id } });

      if (
        accessVerified?.ok &&
        accessVerified.payload.jti &&
        accessVerified.payload.exp
      ) {
        await tx.revokedAccessToken.upsert({
          where: { jti: accessVerified.payload.jti },
          update: {},
          create: {
            jti: accessVerified.payload.jti,
            userId: user.id,
            expiresAt: new Date(accessVerified.payload.exp * 1000),
            reason: "password-change",
          },
        });
      }
    });

    return res.status(200).json({
      message: "Password updated. Please log in again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Onboarding set-password. Distinct from /change-password: it does NOT require
// the current password and does NOT log the user out, so the onboarding wizard
// flows straight through. It is usable ONLY while mustChangePassword === true,
// so it can never act as a current-password bypass once onboarding is done.
// ---------------------------------------------------------------------------
router.post(
  "/onboarding/set-password",
  onboardingSetPasswordLimiter,
  shouldBeUser,
  async (req, res) => {
    try {
      const body = parseBody(onboardingSetPasswordSchema, req.body, res);
      if (!body) return;

      const user = await prisma.user.findFirst({
        where: { id: req.userId, deletedAt: null },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.mustChangePassword !== true) {
        return res
          .status(403)
          .json({ message: "Password change is not required for this account" });
      }

      const newHash = await hashPassword(body.newPassword);

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash, mustChangePassword: false },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          image: true,
          mustChangePassword: true,
        },
      });

      // Intentionally NO session/token revocation here. The account was just
      // provisioned and has a single active session (the one completing the
      // wizard), so there is nothing stale to revoke and the current session
      // stays valid for the rest of onboarding.
      return res.status(200).json({ user: updated });
    } catch (error) {
      console.error("Onboarding set-password error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// =================== ME ====================
router.get("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
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
        hostApplicationPending: true,
        emailVerified: true,
        mustChangePassword: true,
        commissionRate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Commission only makes sense for hosts (and admins acting as one). Regular
    // USER accounts don't get the field at all — neither the override nor the
    // platform default, since exposing the default would leak business config
    // to every signed-in customer.
    if (user.role !== "HOST" && user.role !== "ADMIN") {
      const { commissionRate: _commissionRate, ...rest } = user;
      return res.status(200).json(rest);
    }

    const envDefault = Number.parseFloat(process.env.DEFAULT_COMMISSION_RATE ?? "");
    const platformDefault = Number.isFinite(envDefault) && envDefault >= 0 ? envDefault : 0;
    const effectiveCommissionRate =
      typeof user.commissionRate === "number" ? user.commissionRate : platformDefault;

    return res.status(200).json({ ...user, effectiveCommissionRate });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== UPDATE PROFILE ====================
router.put("/me", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, image, phone, bio } = req.body ?? {};

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
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
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== BECOME HOST ====================
//
// AUTHSVC-005: this endpoint used to flip the user's role to HOST
// immediately. That's straight self-promotion — any user could become a
// host without any review. It now creates a PENDING host application;
// an admin must call `PUT /users/:id/role` to actually grant HOST.
router.post("/become-host", shouldBeUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const body = parseBody(becomeHostSchema, req.body ?? {}, res);
    if (!body) return;

    const currentUser = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.role === "HOST" || currentUser.role === "ADMIN") {
      return res.status(400).json({ message: "Already a host or admin" });
    }

    if (currentUser.hostApplicationPending) {
      return res
        .status(409)
        .json({ message: "Host application already pending review" });
    }

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.hostApplication.create({
        data: {
          userId,
          status: "PENDING",
          applicationData: {
            phone: body.phone ?? currentUser.phone ?? null,
            bio: body.bio ?? currentUser.bio ?? null,
            ...(body.applicationData ?? {}),
          },
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          hostApplicationPending: true,
          // Keep contact details fresh, but DO NOT change role.
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.bio !== undefined && { bio: body.bio }),
        },
      });
      return created;
    });

    await producer.send("host.applied", {
      value: {
        applicationId: application.id,
        userId: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        name: currentUser.name,
      },
    });

    return res.status(202).json({
      message:
        "Your host application has been submitted and is pending admin review.",
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("Become host error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== FORGOT PASSWORD ====================
//
// AUTHSVC-010: always return 202 with a generic body, regardless of
// whether the email belongs to a user. If it does, emit a Kafka event
// carrying a single-use reset token; the email service is responsible
// for putting the token into a templated email.
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const body = parseBody(forgotPasswordSchema, req.body, res);
    if (!body) return;

    const email = normalizeEmail(body.email);
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, username: true },
    });

    if (user) {
      const jti = uuidv4();
      const token = signPasswordResetToken(
        { userId: user.id, email: user.email },
        { jti },
      );
      await producer.send("user.password-reset-requested", {
        value: {
          email: user.email,
          username: user.username,
          token,
          // Expire metadata makes the email template's "this link expires
          // in N minutes" copy correct even if we change the TTL later.
          expiresInMinutes: 30,
        },
      });
    }

    return res.status(202).json({
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// =================== RESET PASSWORD ====================
//
// AUTHSVC-010: verify the JWT, enforce single-use via PasswordResetUse,
// set the new bcrypt-hashed password, and invalidate all existing
// refresh tokens for the user so any stolen sessions are killed.
router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const body = parseBody(resetPasswordSchema, req.body, res);
    if (!body) return;

    const payload = verifyPasswordResetToken(body.token);
    if (!payload || !payload.jti) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Single-use check.
    const alreadyUsed = await prisma.passwordResetUse.findUnique({
      where: { jti: payload.jti },
    });
    if (alreadyUsed) {
      return res.status(400).json({ message: "Reset token has already been used" });
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!user || user.email !== normalizeEmail(payload.email)) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const newHash = await hashPassword(body.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      await tx.passwordResetUse.create({
        data: { jti: payload.jti!, userId: user.id },
      });
      // Invalidate every existing refresh token for the user — a password
      // reset is the right moment to log out all sessions.
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    clearAuthCookies(res);
    return res.status(204).send();
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
