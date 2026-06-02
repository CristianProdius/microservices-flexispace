import { AlertCircle, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import HostCard from "@/components/HostCard";
import HostFilter from "@/components/HostFilter";
import type { HostSummary } from "@repo/types";

interface HostsResponse {
  hosts: HostSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  availableCities: string[];
}

interface HostsPageProps {
  searchParams: Promise<{
    city?: string;
    verified?: string;
    search?: string;
    sort?: string;
  }>;
}

async function getHosts(
  params: Awaited<HostsPageProps["searchParams"]>
): Promise<{ error: boolean; data: HostsResponse | null }> {
  const qs = new URLSearchParams({ limit: "24" });
  if (params.city) qs.set("city", params.city);
  if (params.verified === "true") qs.set("verified", "true");
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);

  try {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/hosts?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { error: true, data: null };
    return { error: false, data: await res.json() };
  } catch {
    return { error: true, data: null };
  }
}

export default async function HostsPage({ searchParams }: HostsPageProps) {
  const params = await searchParams;
  const t = await getTranslations("hosts");
  const result = await getHosts(params);

  if (result.error || !result.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground text-balance">{t("title")}</h1>
          <p className="text-muted mt-2 text-pretty">{t("description")}</p>
        </div>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-foreground text-lg font-medium">{t("loadError")}</p>
          <Link
            href="/hosts"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
          >
            <RefreshCw className="size-4" /> Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground text-balance">{t("title")}</h1>
        <p className="text-muted mt-2 text-pretty">{t("description")}</p>
      </div>

      <HostFilter availableCities={result.data.availableCities} />

      {result.data.hosts.length === 0 ? (
        <p className="text-muted py-12 text-center">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {result.data.hosts.map((host) => (
            <HostCard key={host.id} host={host} />
          ))}
        </div>
      )}
    </div>
  );
}
