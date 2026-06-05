"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { useTranslations } from "next-intl";

const inputClass =
  "w-full px-3.5 py-2.5 border border-border rounded-xl bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      const redirectTo = new URLSearchParams(window.location.search).get("redirect");
      router.push(safeRedirectPath(redirectTo));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2 text-balance">
        {t("signInTitle")}
      </h1>
      <p className="text-sm text-muted text-center lg:text-left mb-8 text-pretty">
        {t("dontHaveAccount")}{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          {tCommon("signUp")}
        </Link>
      </p>

      {error && (
        <div className="mb-6 p-3 bg-danger/10 text-danger rounded-xl text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            placeholder={t("passwordPlaceholder")}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t("signingIn")}
            </span>
          ) : (
            t("signInTitle")
          )}
        </button>
      </form>
    </>
  );
}
