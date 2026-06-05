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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.username, formData.password, formData.name || undefined);
      const redirectTo = new URLSearchParams(window.location.search).get("redirect");
      router.push(safeRedirectPath(redirectTo));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("registrationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2 text-balance">
        {t("createAccount")}
      </h1>
      <p className="text-sm text-muted text-center lg:text-left mb-8 text-pretty">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          {tCommon("signIn")}
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
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">
            {t("username")}
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder={t("usernamePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            {t("fullName")}
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder={t("fullNamePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder={t("passwordPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
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
              {t("creatingAccount")}
            </span>
          ) : (
            tCommon("signUp")
          )}
        </button>
      </form>
    </>
  );
}
