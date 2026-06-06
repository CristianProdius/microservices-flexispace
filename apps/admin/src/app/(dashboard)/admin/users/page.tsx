"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { DataLoadError } from "@/components/dashboard";

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: string;
}

const UsersPage = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading, getToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // AUD-025: defensive cap until the list view supports server-side
      // pagination. Newest-first ordering is server-side; we just bound it.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users?limit=200`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Users could not be loaded. Check the auth service and retry.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
      return;
    }

    if (!authLoading && isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, fetchUsers, isAuthenticated, isAdmin, router]);

  if (authLoading || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Users</h1>
      </div>
      {error ? (
        <DataLoadError message={error} onRetry={fetchUsers} />
      ) : (
        <DataTable columns={columns} data={users} onUsersChanged={fetchUsers} />
      )}
    </div>
  );
};

export default UsersPage;
