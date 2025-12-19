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
} from "@/lib/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  initialize: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    const user = getStoredUser();
    const token = getAccessToken();
    set({
      user,
      isAuthenticated: !!token && !!user,
      isLoading: false,
    });
  },

  login: async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  register: async (email: string, username: string, password: string, name?: string) => {
    const response = await apiRegister(email, username, password, name);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    set({
      user: response.user,
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
        isAuthenticated: false,
      });
    }
  },

  getToken: async () => {
    let token = getAccessToken();

    if (!token) {
      return null;
    }

    // Check if token is expired (simple check - in production, decode JWT)
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // Try to refresh the token
        const newToken = await refreshAccessToken(refreshToken);
        saveTokens(newToken, refreshToken);
        return newToken;
      }
    } catch {
      // Token refresh failed, user needs to re-login
      get().logout();
      return null;
    }

    return token;
  },
}));

export default useAuthStore;
