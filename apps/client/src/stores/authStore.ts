import { create } from "zustand";
import {
  User,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshAccessToken,
  saveTokens,
  saveUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  clearAuth,
  isTokenExpired,
} from "@/lib/auth";
import { getValidToken } from "@/lib/apiClient";
import { routing } from "@/i18n/routing";
import { readLocaleFromCookie } from "@/lib/localeCookie";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
  handleSessionExpired: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = getAccessToken();
    const user = getStoredUser();

    if (!token || !user) {
      clearAuth();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // If token is expired, attempt silent refresh
    if (isTokenExpired(token)) {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");
        const newToken = await refreshAccessToken(refreshToken);
        saveTokens(newToken, refreshToken);
        set({ user, token: newToken, isAuthenticated: true, isLoading: false });
      } catch {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user: User) => {
    saveUser(user);
    set({ user });
  },

  login: async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true,
    });
  },

  register: async (email: string, username: string, password: string, name?: string) => {
    const response = await apiRegister(email, username, password, name);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  getToken: async () => {
    // Delegate to apiClient's getValidToken which has refresh deduplication
    const token = await getValidToken();
    if (!token) {
      if (getAccessToken()) get().handleSessionExpired();
      return null;
    }
    set({ token });
    return token;
  },

  handleSessionExpired: () => {
    clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
    if (typeof window !== "undefined") {
      // localePrefix is "never", so URL never carries the locale. Read the
      // NEXT_LOCALE cookie that next-intl sets via its locale-detection
      // middleware, falling back to the configured default.
      const locale = readLocaleFromCookie();
      const messages: Record<string, string> = {
        en: "Your session has expired. Please sign in again.",
        ro: "Sesiunea ta a expirat. Te rugăm să te autentifici din nou.",
        ru: "Ваша сессия истекла. Пожалуйста, войдите снова.",
      };
      const message = messages[locale] || messages[routing.defaultLocale] || messages.en;
      import("react-toastify").then(({ toast }) => {
        toast.info(message);
      });
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
    }
  },
}));

export default useAuthStore;
