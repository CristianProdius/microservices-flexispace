// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import CompanyIdentity from "@/components/legal/CompanyIdentity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("legal.about");
  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground text-balance">
          {t("title")}
        </h1>
      </header>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-sm md:text-base text-foreground/80 leading-relaxed text-pretty"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-border">
        <CompanyIdentity heading={t("operatorHeading")} />
      </div>
    </div>
  );
}
