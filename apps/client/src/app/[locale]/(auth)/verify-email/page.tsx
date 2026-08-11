"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/auth";
import { useTranslations } from "next-intl";

type Status = "checking" | "success" | "error";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  // Guard against React Strict Mode double-invoke re-running verify with a
  // token that may already have been consumed on some backends.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    if (!token) {
      setStatus("error");
      setMessage(t("verifyEmailMissingToken"));
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage(t("verifyEmailSuccess"));
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : t("verifyEmailFailed"));
      });
  }, [t]);

  if (status === "checking") {
    return (
      <>
        <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2 text-balance">
          {t("verifyEmailTitle")}
        </h1>
        <p className="text-sm text-muted text-center lg:text-left mb-8 text-pretty inline-flex items-center gap-2 w-full justify-center lg:justify-start">
          <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
          {t("verifyEmailChecking")}
        </p>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="flex justify-center lg:justify-start mb-4">
          <CheckCircle2 className="size-10 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2 text-balance">
          {t("verifyEmailTitle")}
        </h1>
        <p className="text-sm text-muted text-center lg:text-left mb-2 text-pretty">{message}</p>
        <p className="text-sm text-muted text-center lg:text-left mb-8 text-pretty">
          {t("verifyEmailSuccessHint")}
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
        >
          {t("verifyEmailGoToLogin")}
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-center lg:justify-start mb-4">
        <XCircle className="size-10 text-danger" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2 text-balance">
        {t("verifyEmailTitle")}
      </h1>
      <div className="mb-6 p-3 bg-danger/10 text-danger rounded-xl text-sm" role="alert">
        {message || t("verifyEmailFailed")}
      </div>
      <p className="text-sm text-muted text-center lg:text-left mb-6 text-pretty">
        {t("verifyEmailFailedHint")}
      </p>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
      >
        {tCommon("signIn")}
      </Link>
    </>
  );
}
