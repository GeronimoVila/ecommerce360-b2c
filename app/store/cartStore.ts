import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coreFetch } from '../../lib/apiClient';

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  availableStock?: number;
  error?: string;
}

interface CouponState {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  projectedDiscount: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  coupon: CouponState | null;
  isSyncing: boolean;
  isDrawerOpen: boolean;

  addItem: (item: Omit<CartItem, 'unitPrice' | 'name'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithBackend: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      coupon: null,
      isSyncing: false,
      isDrawerOpen: false,

      addItem: (newItem) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productId === newItem.productId);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === newItem.productId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, name: 'Cargando...', unitPrice: 0 }] });
        }
        
        set({ isDrawerOpen: true });
        get().syncWithBackend();
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        get().syncWithBackend();
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        });
        get().syncWithBackend();
      },

      clearCart: () => set({ items: [], subtotal: 0, coupon: null }),

      syncWithBackend: async () => {
        const { items, coupon } = get();
        if (items.length === 0) {
          set({ subtotal: 0, coupon: null });
          return;
        }

        set({ isSyncing: true });
        try {
          const payload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
          
          const response = await coreFetch<{ success: boolean; subtotal: number; items: CartItem[] }>(
            '/api/v1/checkout/cart/sync',
            { method: 'POST', body: JSON.stringify({ items: payload }) }
          );

          if (response.success) {
            set({ items: response.items, subtotal: response.subtotal });
            if (coupon) await get().applyCoupon(coupon.code);
          } else {
            set({ items: response.items, subtotal: response.subtotal });
          }
        } catch (error) {
          console.error('Error sincronizando carrito:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      applyCoupon: async (code: string) => {
        const { subtotal } = get();
        if (subtotal === 0) return false;

        try {
          const response = await coreFetch<{ success: boolean; coupon: CouponState }>(
            '/api/v1/checkout/coupons/validate',
            { method: 'POST', body: JSON.stringify({ code, cartSubtotal: subtotal }) }
          );

          if (response.success) {
            set({ coupon: response.coupon });
            return true;
          }
          return false;
        } catch (error) {
          set({ coupon: null });
          throw error;
        }
      },

      removeCoupon: () => set({ coupon: null }),
      
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'ecommerce360-cart',
      partialize: (state) => ({ items: state.items, subtotal: state.subtotal, coupon: state.coupon }),
    }
  )
);