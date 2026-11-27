'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  Ticket,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function CartDrawer() {
  const router = useRouter();
  const cartState = useStore(useCartStore, (state) => state);
  const authState = useStore(useAuthStore, (state) => state);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!cartState || !cartState.isDrawerOpen) return null;

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const success = await cartState.applyCoupon(couponInput);
      if (!success) {
        setCouponError('Cupón inválido o expirado.');
      } else {
        setCouponInput('');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Error validando el cupón.');
    }
  };

  const handleGoToCheckout = () => {
    cartState.closeDrawer();
    if (authState && !authState.isChecking && !authState.isAuthenticated) {
      router.push('/checkout/register');
      return;
    }
    router.push('/checkout');
  };

  const finalTotal = cartState.coupon
    ? Math.max(0, cartState.subtotal - cartState.coupon.projectedDiscount)
    : cartState.subtotal;

  const totalItemsCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);
  const hasStockErrors = cartState.items.some((i) => Boolean(i.error));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      onClick={cartState.closeDrawer}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-950 leading-tight">
                Tu Carrito
              </h2>
              <p className="text-[11px] font-medium text-gray-500">
                {totalItemsCount === 0
                  ? 'Sin artículos'
                  : `${totalItemsCount} ${totalItemsCount === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cartState.closeDrawer}
            aria-label="Cerrar carrito"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartState.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-gray-900">Tu carrito está vacío</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Explorá nuestras ofertas destacadas y agregá productos o combos para comenzar.
              </p>
              <button
                type="button"
                onClick={cartState.closeDrawer}
                className="mt-5 px-4 py-2.5 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            cartState.items.map((item: any) => {
              const thumbUrl = item.imageUrl || item.image || null;
              return (
                <div
                  key={item.productId}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-200/80"
                >
                  <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl border border-gray-200/90 bg-white">
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={item.name || 'Producto'}
                        fill
                        sizes="64px"
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-[10px] text-gray-400">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between gap-2 mt-2.5">
                      <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => cartState.updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                          disabled={cartState.isSyncing}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold text-gray-950 w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => cartState.updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                          disabled={cartState.isSyncing}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-sm text-gray-950">
                          ${(Number(item.unitPrice || 0) * item.quantity).toLocaleString('es-AR')}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-gray-400">
                            ${Number(item.unitPrice || 0).toLocaleString('es-AR')} c/u
                          </p>
                        )}
                      </div>
                    </div>

                    {item.error && (
                      <p className="text-red-600 text-[11px] mt-1.5 font-semibold">{item.error}</p>
                    )}

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => cartState.removeItem(item.productId)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                        disabled={cartState.isSyncing}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartState.items.length > 0 && (
          <div className="p-5 border-t border-gray-200/90 bg-white space-y-4">
            <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-xl p-3">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
                <Ticket className="w-3.5 h-3.5 text-[#0056D2]" />
                Cupón de descuento
              </label>

              {!cartState.coupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Ej: ELECTRO10"
                    className="border border-gray-200 bg-white px-3 py-2 w-full text-xs font-mono uppercase rounded-xl focus:outline-none focus:border-[#0056D2]"
                    disabled={cartState.isSyncing}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || cartState.isSyncing}
                    className="bg-gray-950 hover:bg-slate-800 disabled:bg-gray-300 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    Aplicar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                  <span className="inline-flex items-center gap-1.5 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00A859]" />
                    <span className="font-mono">{cartState.coupon.code}</span>
                    <span className="text-[#00A859]">
                      (-${cartState.coupon.projectedDiscount.toLocaleString('es-AR')})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={cartState.removeCoupon}
                    className="text-red-600 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-red-600 text-[11px] font-semibold mt-1.5">{couponError}</p>
              )}
            </div>

            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ${cartState.subtotal.toLocaleString('es-AR')}
                </span>
              </div>

              {cartState.coupon && (
                <div className="flex justify-between text-[#00A859] font-semibold">
                  <span>Descuento ({cartState.coupon.code})</span>
                  <span>-${cartState.coupon.projectedDiscount.toLocaleString('es-AR')}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline font-extrabold text-lg pt-2.5 border-t border-gray-100 text-gray-950">
                <span>Total estimado</span>
                <span className="text-xl text-gray-950">
                  ${finalTotal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-[#0056D2] hover:bg-blue-700 disabled:bg-gray-300 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              disabled={cartState.isSyncing || hasStockErrors}
              onClick={handleGoToCheckout}
            >
              {cartState.isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando carrito...</span>
                </>
              ) : (
                <>
                  <span>Continuar al Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A859]" />
              <span>Reserva inmediata de stock al confirmar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}