import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coreFetch } from '../lib/apiClient';
import { DynamicPricing } from '../types/product';

export type CheckoutPaymentMethod = 'MOBBEX' | 'MP' | 'TRANSFERENCIA';

export interface CartItem {
  productId: string;
  name: string;
  basePrice?: number;
  unitPrice: number;
  discountPercentage?: number;
  interestPercentage?: number;
  quantity: number;
  itemTotal?: number;
  availableStock?: number;
  dynamicPricing?: DynamicPricing;
  imageUrl?: string | null;
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
  baseSubtotal: number;
  subtotal: number;
  paymentMethod: CheckoutPaymentMethod;
  installments: number;
  coupon: CouponState | null;
  isSyncing: boolean;
  isDrawerOpen: boolean;

  addItem: (item: Omit<CartItem, 'unitPrice' | 'name'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setPaymentOption: (paymentMethod: CheckoutPaymentMethod, installments?: number) => void;
  clearCart: () => void;
  syncWithBackend: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

let syncRequestId = 0;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      baseSubtotal: 0,
      subtotal: 0,
      paymentMethod: 'MOBBEX',
      installments: 1,
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

      setPaymentOption: (paymentMethod, installments = 1) => {
        const normalizedInstallments = paymentMethod === 'TRANSFERENCIA' ? 1 : Math.max(1, installments);
        set({ paymentMethod, installments: normalizedInstallments });
        get().syncWithBackend();
      },

      clearCart: () => {
        syncRequestId += 1;
        set({
          items: [],
          baseSubtotal: 0,
          subtotal: 0,
          coupon: null,
          paymentMethod: 'MOBBEX',
          installments: 1,
          isSyncing: false,
          isDrawerOpen: false,
        });
      },

      syncWithBackend: async () => {
        const { items, coupon, paymentMethod, installments } = get();
        if (items.length === 0) {
          set({ baseSubtotal: 0, subtotal: 0, coupon: null, isSyncing: false });
          return;
        }

        const currentRequestId = ++syncRequestId;
        set({ isSyncing: true });

        try {
          const payload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

          const response = await coreFetch<{
            success: boolean;
            baseSubtotal?: number;
            subtotal: number;
            items: CartItem[];
          }>('/api/v1/checkout/cart/sync', {
            method: 'POST',
            body: JSON.stringify({
              items: payload,
              paymentMethod,
              installments,
            }),
          });

          if (currentRequestId !== syncRequestId) return;

          set({
            items: response.items,
            baseSubtotal: response.baseSubtotal ?? response.subtotal,
            subtotal: response.subtotal,
          });

          if (response.success && coupon) {
            try {
              const couponValid = await get().applyCoupon(coupon.code);
              if (!couponValid) {
                set({ coupon: null });
              }
            } catch {
              set({ coupon: null });
            }
          }
        } catch (error) {
          console.error('Error sincronizando carrito:', error);
        } finally {
          if (currentRequestId === syncRequestId) {
            set({ isSyncing: false });
          }
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
          set({ coupon: null });
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
      partialize: (state) => ({
        items: state.items,
        baseSubtotal: state.baseSubtotal,
        subtotal: state.subtotal,
        paymentMethod: state.paymentMethod,
        installments: state.installments,
        coupon: state.coupon,
      }),
    }
  )
);