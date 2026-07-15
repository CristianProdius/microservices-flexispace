// DRAFT legal content — pending review by legal counsel before production.
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export interface LegalBlock {
  type?: "paragraph" | "heading" | "list";
  text?: string;
  items?: string[];
}

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

interface LegalPageProps {
  title: string;
  intro?: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  sections: LegalSection[];
  /** Optional extra content rendered after the sections (e.g. company identity block). */
  footer?: ReactNode;
}

/**
 * Shared shell for the maib-required legal / policy pages.
 * Content is supplied via next-intl messages so all locales stay in sync.
 */
const LegalPage = ({
  title,
  intro,
  lastUpdatedLabel,
  lastUpdated,
  sections,
  footer,
}: LegalPageProps) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground text-balance">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {lastUpdatedLabel}: {lastUpdated}
        </p>
        {intro ? (
          <p className="mt-4 text-base text-foreground/80 text-pretty leading-relaxed">
            {intro}
          </p>
        ) : null}
      </header>

      <div className="space-y-10">
        {sections.map((section, index) => (
          <section key={`${section.heading}-${index}`} aria-label={section.heading}>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
              {index + 1}. {section.heading}
            </h2>
            <div className="space-y-4">
              {section.blocks.map((block, blockIndex) => {
                if (block.type === "heading") {
                  return (
                    <h3
                      key={blockIndex}
                      className="text-base font-semibold text-foreground pt-2"
                    >
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "list" && block.items) {
                  return (
                    <ul
                      key={blockIndex}
                      className="list-disc pl-5 space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed"
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-pretty">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p
                    key={blockIndex}
                    className="text-sm md:text-base text-foreground/80 leading-relaxed text-pretty"
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {footer ? <div className="mt-12 pt-8 border-t border-border">{footer}</div> : null}
    </div>
  );
};

export const LegalCrossLink = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => (
  <Link href={href} className="text-primary underline hover:no-underline">
    {label}
  </Link>
);

export default LegalPage;
