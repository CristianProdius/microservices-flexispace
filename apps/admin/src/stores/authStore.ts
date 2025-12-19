import { create } from "zustand";
import type { User, AuthResponse } from "@/lib/auth";

// Lazy import auth functions to avoid SSR issues with localStorage
const getAuthFunctions = () => {
  if (typeof window === "undefined") {
    return {
      login: async (): Promise<AuthResponse> => {
        throw new Error("Not available on server");
      },
      logout: async () => {},
      refreshAccessToken: async () => "",
      saveTokens: () => {},
      saveUser: () => {},
      getAccessToken: (): string | null => null,
      getRefreshToken: (): string | null => null,
      getStoredUser: (): User | null => null,
      clearAuth: () => {},
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/auth") as typeof import("@/lib/auth");
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  initialize: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  initialize: () => {
    // Only run on client side
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const auth = getAuthFunctions();
    const user = auth.getStoredUser();
    const token = auth.getAccessToken();
    set({
      user,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "ADMIN",
      isLoading: false,
    });
  },

  login: async (email: string, password: string) => {
    const auth = getAuthFunctions();
    const response = await auth.login(email, password);

    if (response.user.role !== "ADMIN") {
      throw new Error("Admin access required");
    }

    auth.saveTokens(response.accessToken, response.refreshToken);
    auth.saveUser(response.user);
    set({
      user: response.user,
      isAuthenticated: true,
      isAdmin: true,
    });
  },

  logout: async () => {
    const auth = getAuthFunctions();
    try {
      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        await auth.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      auth.clearAuth();
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  },

  getToken: async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      return null;
    }

    const auth = getAuthFunctions();
    const token = auth.getAccessToken();

    if (!token) {
      return null;
    }

    try {
      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        const newToken = await auth.refreshAccessToken(refreshToken);
        auth.saveTokens(newToken, refreshToken);
        return newToken;
      }
    } catch {
      get().logout();
      return null;
    }

    return token;
  },
}));

export default useAuthStore;
