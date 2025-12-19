"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Booking } from "@repo/types";

const BookingsPage = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading, getToken } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
      return;
    }

    if (!authLoading && isAuthenticated && isAdmin) {
      fetchBookings();
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchBookings = async () => {
    try {
      const token = await getToken();
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
        <h1 className="font-semibold">All Bookings</h1>
      </div>
      <DataTable columns={columns} data={bookings} />
    </div>
  );
};

export default BookingsPage;
