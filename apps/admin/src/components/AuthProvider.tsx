"use client";

import { useEffect } from "react";
import useAuthStore from "@/stores/authStore";

interface AuthState {
  initialize: () => void;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state: AuthState) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
