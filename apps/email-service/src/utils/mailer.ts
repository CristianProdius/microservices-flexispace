import { Resend } from "resend";

// RFC 5321 / 5322 are permissive; we just want to reject obvious
// shenanigans like display-name injection (e.g. quotes, commas, angle
// brackets, CR/LF). Operator-controlled, but failing fast at startup
// beats a malformed `From:` header in production.
const BARE_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const validateFromEmail = (value: string | undefined): string => {
  if (!value) {
    throw new Error("RESEND_FROM_EMAIL is required to send email");
  }

  if (!BARE_EMAIL_REGEX.test(value)) {
    throw new Error(
      `RESEND_FROM_EMAIL must be a bare email address (got: ${JSON.stringify(value)})`
    );
  }

  return value;
};

// AUD-B7-EMAIL-01: a malformed recipient is a permanent (non-retryable)
// failure — retrying it just burns MAX_RETRIES doomed `resend.emails.send`
// calls and eventually parks the message anyway. We mark it explicitly so the
// consumer can route it straight to the DLQ instead of into the retry loop.
export class InvalidRecipientError extends Error {
  readonly retryable = false;

  constructor(value: unknown) {
    super(
      `recipient must be a bare email address (got: ${JSON.stringify(value)})`
    );
    this.name = "InvalidRecipientError";
  }
}

// AUD-B7-EMAIL-01: apply the same bare-email rigor to the `to` address that
// `validateFromEmail` applies to `from`. Handlers previously only gated on
// truthiness, so a garbage recipient reached Resend and failed transiently.
export const validateToEmail = (value: string | undefined): string => {
  if (!value || !BARE_EMAIL_REGEX.test(value)) {
    throw new InvalidRecipientError(value);
  }

  return value;
};

let cachedClient: Resend | null = null;
let cachedApiKey: string | null = null;

const getResendClient = (apiKey: string): Resend => {
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new Resend(apiKey);
  cachedApiKey = apiKey;
  return cachedClient;
};

const sendMail = async ({
  email,
  subject,
  text,
  idempotencyKey,
}: {
  email: string;
  subject: string;
  text: string;
  idempotencyKey?: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send email");
  }

  // AUD-B7-EMAIL-01: validate the recipient BEFORE touching Resend. Throwing
  // InvalidRecipientError (retryable=false) lets the consumer DLQ the message
  // immediately instead of retrying a doomed send MAX_RETRIES times.
  validateToEmail(email);

  const fromEmail = validateFromEmail(process.env.RESEND_FROM_EMAIL);

  const resend = getResendClient(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    {
      from: `Spacefly.ai <${fromEmail}>`,
      to: email,
      subject,
      text,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  if (error) {
    // AUD-036: do not echo recipient or full payload in error logs either.
    throw new Error(`Failed to send email: ${error.message}`);
  }

  // AUD-036: log only the Resend message id, never the full response (which
  // includes the recipient address and other PII).
  console.log("Email sent:", { id: data?.id });
};

export default sendMail;
