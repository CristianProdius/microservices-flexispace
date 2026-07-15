// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import LegalPage, {
  LegalCrossLink,
  type LegalSection,
} from "@/components/legal/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.refunds" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function RefundsPage() {
  const t = await getTranslations("legal.refunds");
  const tCommon = await getTranslations("legal.common");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      lastUpdatedLabel={tCommon("lastUpdated")}
      lastUpdated={tCommon("effectiveDate")}
      sections={sections}
      footer={
        <p className="text-sm text-foreground/80">
          {t("relatedPolicies")}{" "}
          <LegalCrossLink href="/terms" label={t("termsLink")} /> ·{" "}
          <LegalCrossLink href="/contact" label={t("contactLink")} />
        </p>
      }
    />
  );
}
