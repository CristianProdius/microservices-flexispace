"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { AdminBooking, columns } from "./columns";
import { DataTable } from "./data-table";
import { DataLoadError } from "@/components/dashboard";

const BookingsPage = () => {
  const router = useRouter();
  // Avoid subscribing to `getToken` from the store — Zustand returns a fresh
  // function reference on every state change, which would re-create the
  // useCallback and re-fire the fetch on unrelated store updates.
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuthStore();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const token = await useAuthStore.getState().getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      setError("Bookings could not be loaded. Check the order service and retry.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
      return;
    }

    if (!authLoading && isAuthenticated && isAdmin) {
      fetchBookings();
    }
  }, [authLoading, fetchBookings, isAuthenticated, isAdmin, router]);

  if (authLoading || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Bookings</h1>
      </div>
      {error ? (
        <DataLoadError message={error} onRetry={fetchBookings} />
      ) : (
        <DataTable columns={columns} data={bookings} />
      )}
    </div>
  );
};

export default BookingsPage;
