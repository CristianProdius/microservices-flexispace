"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { Space } from "@repo/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { DataLoadError } from "@/components/dashboard";

const SpacesPage = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuthStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
      return;
    }

    if (!authLoading && isAuthenticated && isAdmin) {
      fetchSpaces();
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchSpaces = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch spaces");
      }

      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error(err);
      setError("Spaces could not be loaded. Check the product service and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Spaces</h1>
      </div>
      {error ? (
        <DataLoadError message={error} onRetry={fetchSpaces} />
      ) : (
        <DataTable
          columns={columns}
          data={spaces}
          onSpacesChanged={fetchSpaces}
        />
      )}
    </div>
  );
};

export default SpacesPage;
