"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { columns } from "./columns";
import { DataTable } from "./data-table";

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

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
      return;
    }

    if (!authLoading && isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users`,
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
        <h1 className="font-semibold">All Users</h1>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  );
};

export default UsersPage;
