"use client";

import { LogOut, CalendarDays, User, Building2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import useAuthStore from "@/stores/authStore";

const ProfileButton = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  const isHost = user?.role === "HOST" || user?.role === "ADMIN";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-200"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">{user?.name || "User"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.role && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {user.role}
              </span>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                router.push("/bookings");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <CalendarDays className="w-4 h-4" />
              My Bookings
            </button>

            {isHost && (
              <button
                onClick={() => {
                  router.push("/host");
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Building2 className="w-4 h-4" />
                Host Dashboard
              </button>
            )}

            {!isHost && (
              <button
                onClick={() => {
                  router.push("/become-host");
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3"
              >
                <Building2 className="w-4 h-4" />
                Become a Host
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;
