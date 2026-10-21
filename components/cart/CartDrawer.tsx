'use client';

import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { useCartStore } from '../../app/store/cartStore';
import { createCheckoutIntent } from '../../services/checkout';

export default function CartDrawer() {
  const cartState = useStore(useCartStore, (state) => state);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (!cartState) return null;
  if (!cartState.isDrawerOpen) return null;

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const success = await cartState.applyCoupon(couponInput);
      if (!success) setCouponError('Cupón inválido o expirado.');
    } catch (err: any) {
      setCouponError(err.message || 'Error validando el cupón.');
    }
  };

  const handleProceedToPayment = async () => {
    setCheckoutError('');
    setIsSubmitting(true);

    try {
      await cartState.syncWithBackend();

      const freshItems = useCartStore.getState().items;

      if (!freshItems || freshItems.length === 0) {
        setCheckoutError('El carrito quedó vacío tras validar el stock.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        items: freshItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: 'MP' as const,
      };

      const response = await createCheckoutIntent(payload);

      if (response.success && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        setCheckoutError(response.error || 'No se pudo generar la orden de pago.');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Error procesando checkout:', error);
      setCheckoutError('Error de conexión con el servidor de pagos.');
      setIsSubmitting(false);
    }
  };

  const finalTotal = cartState.coupon 
    ? cartState.subtotal - cartState.coupon.projectedDiscount 
    : cartState.subtotal;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="w-96 bg-white h-full shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold">Tu Carrito</h2>
          <button onClick={cartState.closeDrawer} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartState.items.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">El carrito está vacío.</p>
          ) : (
            cartState.items.map((item) => (
              <div key={item.productId} className="flex justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <button 
                      onClick={() => cartState.updateQuantity(item.productId, item.quantity - 1)} 
                      className="px-2 bg-gray-200 rounded"
                      disabled={isSubmitting}
                    >-</button>
                    <span className="text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => cartState.updateQuantity(item.productId, item.quantity + 1)} 
                      className="px-2 bg-gray-200 rounded"
                      disabled={isSubmitting}
                    >+</button>
                  </div>
                  {item.error && <p className="text-red-500 text-xs mt-1">{item.error}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold">${item.unitPrice?.toLocaleString('es-AR')}</p>
                  <button 
                    onClick={() => cartState.removeItem(item.productId)} 
                    className="text-xs text-red-500 mt-2 hover:underline"
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartState.items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="mb-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={couponInput} 
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Código de descuento" 
                  className="border p-2 w-full text-sm rounded"
                  disabled={!!cartState.coupon || cartState.isSyncing || isSubmitting}
                />
                {!cartState.coupon ? (
                  <button 
                    onClick={handleApplyCoupon} 
                    disabled={!couponInput || cartState.isSyncing || isSubmitting} 
                    className="bg-black text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
                  >
                    Aplicar
                  </button>
                ) : (
                  <button 
                    onClick={cartState.removeCoupon} 
                    disabled={isSubmitting}
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {cartState.coupon && (
                <p className="text-green-600 text-xs mt-1">
                  Cupón aplicado: -${cartState.coupon.projectedDiscount.toLocaleString('es-AR')}
                </p>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${cartState.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {cartState.coupon && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({cartState.coupon.code})</span>
                  <span>-${cartState.coupon.projectedDiscount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Estimado</span>
                <span>${finalTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {checkoutError && (
              <p className="text-red-600 text-xs mb-3 text-center font-medium">{checkoutError}</p>
            )}

            <button 
              className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={cartState.isSyncing || isSubmitting || cartState.items.some(i => i.error)}
              onClick={handleProceedToPayment}
            >
              {isSubmitting ? 'Procesando Pago...' : cartState.isSyncing ? 'Sincronizando...' : 'Proceder al Pago'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}