"use client";

import { Link } from "@/i18n/navigation";
import { Instagram, Facebook, Linkedin, Twitter, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Accordion } from "@base-ui/react/accordion";
import { cn } from "@/lib/utils";
import { getFooterLinkKey } from "./footer-link-key";

interface FooterColumnLink {
  external?: boolean;
  href: string;
  label: string;
}

interface FooterColumn {
  links: FooterColumnLink[];
  title: string;
}

interface CompanyDetails {
  legalName: string;
  idno: string;
  address: string;
}

interface FooterClientProps {
  columns: FooterColumn[];
  copyright: string;
  privacyPolicy: string;
  privacyPolicyHref: string;
  tagline: string;
  termsOfService: string;
  termsOfServiceHref: string;
  trustLine: string;
  legalIdentityHeading: string;
  idnoLabel: string;
  acceptedPayments: string;
  company: CompanyDetails;
  paymentMethods: readonly string[];
}

const FooterClient = ({
  columns,
  copyright,
  privacyPolicy,
  privacyPolicyHref,
  tagline,
  termsOfService,
  termsOfServiceHref,
  trustLine,
  legalIdentityHeading,
  idnoLabel,
  acceptedPayments,
  company,
  paymentMethods,
}: FooterClientProps) => {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              aria-label="Spacefly.ai home"
              className="inline-flex"
            >
              <Image
                src="/brand/wordmark_transparent.png"
                alt="Spacefly.ai"
                width={172}
                height={56}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted mt-1 text-pretty">{tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-muted hover:text-primary transition-colors"
              >
                <social.icon className="size-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-4 rounded-xl border border-border overflow-hidden">
          {columns.map((column, index) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className={cn("p-6", index > 0 && "border-l border-border")}
            >
              <p className="text-sm font-semibold text-foreground mb-4">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={getFooterLinkKey(column.title, link, linkIndex)}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted hover:text-primary transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="md:hidden">
          <Accordion.Root>
            {columns.map((column) => (
              <Accordion.Item key={column.title} className="border-t border-border">
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-sm font-semibold text-foreground cursor-pointer">
                    {column.title}
                    <ChevronDown className="size-4 text-muted transition-transform data-[panel-open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  <nav aria-label={column.title}>
                    <ul className="pb-3 space-y-2">
                      {column.links.map((link, linkIndex) => (
                        <li key={getFooterLinkKey(column.title, link, linkIndex)}>
                          {link.external ? (
                            <a
                              href={link.href}
                              className="text-sm text-muted hover:text-primary transition-colors"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="text-sm text-muted hover:text-primary transition-colors"
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Company legal identity (maib merchant requirement: IDNO, legal name, address) */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm font-semibold text-foreground mb-2">
            {legalIdentityHeading}
          </p>
          <p className="text-sm text-muted text-pretty">
            {company.legalName} · {idnoLabel} {company.idno}
          </p>
          <p className="text-sm text-muted text-pretty">{company.address}</p>
        </div>

        {/* Accepted payment methods.
            TODO: swap these text badges for official maib / Visa / Mastercard SVG logo assets. */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm text-muted">{acceptedPayments}:</span>
          <div className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground/80"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted text-pretty">{trustLine}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>{copyright}</span>
            <Link
              href={termsOfServiceHref}
              className="hover:text-foreground transition-colors"
            >
              {termsOfService}
            </Link>
            <Link
              href={privacyPolicyHref}
              className="hover:text-foreground transition-colors"
            >
              {privacyPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterClient;
