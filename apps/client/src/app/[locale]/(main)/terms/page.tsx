// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import LegalPage, {
  LegalCrossLink,
  type LegalSection,
} from "@/components/legal/LegalPage";
import CompanyIdentity from "@/components/legal/CompanyIdentity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");
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
        <div className="space-y-4">
          <CompanyIdentity heading={tCommon("operatorHeading")} />
          <p className="text-sm text-foreground/80">
            {t("relatedPolicies")}{" "}
            <LegalCrossLink href="/privacy" label={t("privacyLink")} /> ·{" "}
            <LegalCrossLink href="/refunds" label={t("refundLink")} />
          </p>
        </div>
      }
    />
  );
}
