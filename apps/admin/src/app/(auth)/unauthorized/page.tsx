"use client";

import useAuthStore from "@/stores/authStore";
import { useRouter } from "next/navigation";

const Page = () => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">You do not have access!</h1>
      <p className="text-gray-500">
        Please contact an administrator if you believe this is an error.
      </p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  );
};

export default Page;
