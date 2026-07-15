// DRAFT legal content — pending review by legal counsel before production.
import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/company";

interface CompanyIdentityProps {
  heading?: string;
}

/**
 * Renders PRODIUS ENTERPRISE S.R.L. legal identification block
 * (legal name, IDNO, address, contact) — required by maib for merchants.
 */
const CompanyIdentity = async ({ heading }: CompanyIdentityProps) => {
  const t = await getTranslations("legal.identity");

  const rows: { label: string; value: string; href?: string }[] = [
    { label: t("legalName"), value: COMPANY.legalName },
    { label: t("idno"), value: COMPANY.idno },
    { label: t("address"), value: COMPANY.address },
    {
      label: t("registered"),
      value: `${COMPANY.registeredDate}, ${COMPANY.registrar}`,
    },
    { label: t("email"), value: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { label: t("phone"), value: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, "")}` },
  ];

  return (
    <div>
      {heading ? (
        <h2 className="text-base font-semibold text-foreground mb-3">{heading}</h2>
      ) : null}
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col sm:flex-row sm:gap-2">
            <dt className="font-medium text-foreground/70 sm:min-w-40">{row.label}</dt>
            <dd className="text-foreground/90">
              {row.href ? (
                <a href={row.href} className="text-primary hover:underline">
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default CompanyIdentity;
