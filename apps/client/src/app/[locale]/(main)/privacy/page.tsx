// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import CompanyIdentity from "@/components/legal/CompanyIdentity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");
  const tCommon = await getTranslations("legal.common");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      lastUpdatedLabel={tCommon("lastUpdated")}
      lastUpdated={tCommon("effectiveDate")}
      sections={sections}
      footer={<CompanyIdentity heading={tCommon("controllerHeading")} />}
    />
  );
}
