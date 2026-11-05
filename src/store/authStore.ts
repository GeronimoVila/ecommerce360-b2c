import { create } from 'zustand';
import { authService } from '../services/auth.service';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isChecking: boolean;
  checkSession: () => Promise<void>;
  setSession: (user: any) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isChecking: true,

  checkSession: async () => {
    try {
      const data = await authService.getSession();
      if (data && data.user) {
        set({ isAuthenticated: true, user: data.user, isChecking: false });
      } else {
        set({ isAuthenticated: false, user: null, isChecking: false });
      }
    } catch (error) {
      set({ isAuthenticated: false, user: null, isChecking: false });
    }
  },

  setSession: (user) => set({ isAuthenticated: true, user, isChecking: false }),

  logout: async () => {
    try {
      await authService.logout();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }
}));