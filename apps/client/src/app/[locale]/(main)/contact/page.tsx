// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import CompanyIdentity from "@/components/legal/CompanyIdentity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("legal.contact");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground text-balance">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-foreground/80 leading-relaxed text-pretty">
          {t("intro")}
        </p>
      </header>

      <div className="rounded-xl border border-border p-6">
        <CompanyIdentity heading={t("operatorHeading")} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t("supportHeading")}
        </h2>
        <p className="text-sm md:text-base text-foreground/80 leading-relaxed text-pretty">
          {t("supportBody")}
        </p>
      </div>
    </div>
  );
}
