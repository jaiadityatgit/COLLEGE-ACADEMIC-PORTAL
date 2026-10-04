import { create } from "zustand";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  designation?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const loadUser = (): User | null => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/login", credentials);
      const { accessToken, user } = res.data.data;
      localStorage.setItem("token", accessToken);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        if (user.collegeId) {
          localStorage.setItem("tenantId", user.collegeId);
        }
      }
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Login failed. Please verify credentials.",
        isLoading: false
      });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/register", data);
      set({ isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Registration failed.",
        isLoading: false
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed, cleaning local state anyway", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("tenantId");
      localStorage.removeItem("user");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
