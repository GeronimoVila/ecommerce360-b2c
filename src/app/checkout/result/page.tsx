'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { coreFetch } from '../../../lib/apiClient';
import { useCartStore } from '../../../store/cartStore';

interface OrderStatusResponse {
  id: string;
  status: 'PENDING' | 'BUDGET' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
  payment_method: string | null;
  total_amount: number;
  items_count: number;
  created_at: string;
}

type ViewState = 'VERIFYING' | 'APPROVED' | 'PENDING_WEBHOOK' | 'REJECTED' | 'NOT_FOUND';

const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    '';
  const gateway = searchParams.get('gateway') || 'PASARELA';
  const rawOutcome =
    searchParams.get('outcome') ||
    searchParams.get('status') ||
    searchParams.get('collection_status') ||
    '';

  const [viewState, setViewState] = useState<ViewState>('VERIFYING');
  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const cartClearedRef = useRef(false);

  const isExplicitFailure = ['failure', 'rejected', 'cancelled', 'null'].includes(
    rawOutcome.toLowerCase()
  );

  useEffect(() => {
    if (!orderId) {
      setViewState('NOT_FOUND');
      return;
    }

    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;

    const verifyOrderStatus = async (attempt: number) => {
      try {
        const data = await coreFetch<OrderStatusResponse>(
          `/api/v1/orders/${encodeURIComponent(orderId)}/status`
        );

        if (isCancelled) return;
        setOrderData(data);

        if (['PAID', 'SHIPPED', 'DELIVERED'].includes(data.status)) {
          if (!cartClearedRef.current) {
            clearCart();
            cartClearedRef.current = true;
          }
          setViewState('APPROVED');
          return;
        }

        if (data.status === 'CANCELED') {
          setViewState('REJECTED');
          return;
        }

        if (isExplicitFailure) {
          setViewState('REJECTED');
          return;
        }

        if (attempt < MAX_POLL_ATTEMPTS) {
          setAttemptCount(attempt + 1);
          timer = setTimeout(() => {
            verifyOrderStatus(attempt + 1);
          }, POLL_INTERVAL_MS);
        } else {
          if (rawOutcome.toLowerCase() === 'approved' && !cartClearedRef.current) {
            clearCart();
            cartClearedRef.current = true;
          }
          setViewState('PENDING_WEBHOOK');
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('[CheckoutResult] Error verificando orden:', err);
        if (isExplicitFailure) {
          setViewState('REJECTED');
        } else {
          setViewState('NOT_FOUND');
        }
      }
    };

    verifyOrderStatus(0);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, isExplicitFailure, rawOutcome, clearCart]);

  const handleReturnToCart = () => {
    router.push('/');
    setTimeout(() => openDrawer(), 150);
  };

  if (viewState === 'VERIFYING') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">
            Confirmando tu pago...
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Estamos validando la acreditación con {gateway === 'MOBBEX' ? 'Mobbex' : 'la pasarela de pagos'}. No cierres esta ventana.
          </p>
          {attemptCount > 0 && (
            <p className="text-xs text-slate-400 mt-4 font-mono">
              Sincronizando comprobante ({attemptCount}/{MAX_POLL_ATTEMPTS})...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'APPROVED') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            ¡Pago Aprobado!
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Tu pedido{' '}
            <strong className="font-mono text-slate-900">
              #ORD-{orderData?.id.slice(0, 8).toUpperCase()}
            </strong>{' '}
            ya está confirmado y en preparación.
          </p>

          {orderData && (
            <div className="mt-6 bg-slate-50 rounded-xl p-4 text-left text-sm border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total abonado:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${orderData.total_amount.toLocaleString('es-AR')} ARS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medio de pago:</span>
                <span className="font-semibold text-slate-800">
                  {orderData.payment_method || gateway}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Artículos:</span>
                <span className="font-medium text-slate-800">
                  {orderData.items_count}{' '}
                  {orderData.items_count === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="mt-7 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'PENDING_WEBHOOK') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-9 h-9 text-amber-600" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Pago en Proceso de Acreditación
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Registramos tu operación{' '}
            {orderData && (
              <strong className="font-mono text-slate-900">
                #ORD-{orderData.id.slice(0, 8).toUpperCase()}
              </strong>
            )}
            . La pasarela está terminando de confirmar la acreditación bancaria; te notificaremos apenas impacte.
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar Nuevamente
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
            >
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-9 h-9 text-rose-600" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          {viewState === 'NOT_FOUND'
            ? 'No pudimos ubicar la orden'
            : 'El pago no pudo completarse'}
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {viewState === 'NOT_FOUND'
            ? 'El enlace de retorno no contiene un identificador de orden válido.'
            : 'La operación fue rechazada o cancelada antes de finalizar. Conservamos los productos en tu carrito para que puedas reintentar.'}
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            onClick={handleReturnToCart}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Carrito y Reintentar
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full text-slate-500 hover:text-slate-800 font-semibold py-2 text-xs transition-colors"
          >
            Seguir viendo productos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <CheckoutResultContent />
    </Suspense>
  );
}