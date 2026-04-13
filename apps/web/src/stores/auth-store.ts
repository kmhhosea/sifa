import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Business {
  id: string;
  name: string;
  currency: string;
  role: string;
}

interface AuthState {
  user: User | null;
  businesses: Business[];
  currentBusiness: Business | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  setCurrentBusiness: (business: Business | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      businesses: [],
      currentBusiness: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setBusinesses: (businesses) => set({ businesses }),
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      logout: () =>
        set({
          user: null,
          businesses: [],
          currentBusiness: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
