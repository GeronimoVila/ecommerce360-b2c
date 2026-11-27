import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { useCartStore } from './cartStore';

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
    } catch {
      set({ isAuthenticated: false, user: null, isChecking: false });
    }
  },

  setSession: (user) => set({ isAuthenticated: true, user, isChecking: false }),

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      useCartStore.getState().clearCart();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('ecommerce360-cart');
      }
      set({ isAuthenticated: false, user: null, isChecking: false });
    }
  },
}));