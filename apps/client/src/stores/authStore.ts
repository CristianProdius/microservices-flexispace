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
import useBookingStore from "@/stores/bookingStore";

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
    // AUD-B5: guarantee isLoading is cleared no matter how we exit. Any throw
    // here (e.g. from a corrupted store) used to leave isLoading=true forever,
    // hiding all auth controls with no way to recover.
    try {
      const token = getAccessToken();
      const user = getStoredUser();

      if (!token || !user) {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false });
        return;
      }

      // If token is expired, attempt silent refresh
      if (isTokenExpired(token)) {
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) throw new Error("No refresh token");
          const refreshed = await refreshAccessToken(refreshToken);
          // Persist whichever refresh token the server returned; if the server
          // rotated it we must use the new one or the next refresh will fail.
          saveTokens(refreshed.accessToken, refreshed.refreshToken ?? refreshToken);
          set({ user, token: refreshed.accessToken, isAuthenticated: true });
        } catch {
          clearAuth();
          set({ user: null, token: null, isAuthenticated: false });
        }
        return;
      }

      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    saveUser(user);
    set({ user });
  },

  login: async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    // AUD-B5: drop any persisted booking draft on login so user B on a shared
    // device doesn't inherit user A's checkout draft (mirrors logout/
    // handleSessionExpired).
    useBookingStore.getState().clearDraft();
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
    // AUD-B5: same shared-device concern as login — clear any inherited draft.
    useBookingStore.getState().clearDraft();
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
      // Drop the persisted booking draft so user B logging in on a shared
      // device doesn't land on /checkout with user A's space/host/pricing.
      useBookingStore.getState().clearDraft();
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
    // Same shared-device concern as `logout` — wipe the draft so it can't
    // bleed across users after a session-expired bounce.
    useBookingStore.getState().clearDraft();
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
