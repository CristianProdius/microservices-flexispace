"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarDays, Search } from "lucide-react";
import ProfileButton from "./ProfileButton";
import useAuthStore from "@/stores/authStore";

const Navbar = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  return (
    <nav className="w-full flex items-center justify-between border-b border-gray-200 pb-4">
      {/* LEFT */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="hidden sm:block text-lg font-bold text-gray-900">
          FlexiSpace
        </span>
      </Link>

      {/* CENTER */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/spaces"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Browse Spaces
        </Link>
        {isAuthenticated && (
          <Link
            href="/bookings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            My Bookings
          </Link>
        )}
        {isAuthenticated && user?.role === "HOST" && (
          <Link
            href="/host"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Host Dashboard
          </Link>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <Link
          href="/spaces"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Search className="w-5 h-5" />
        </Link>

        {isAuthenticated && (
          <Link
            href="/bookings"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <CalendarDays className="w-5 h-5" />
          </Link>
        )}

        {!isLoading && (
          <>
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/become-host"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Become a Host
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <ProfileButton />
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
