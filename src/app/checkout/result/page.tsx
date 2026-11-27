'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Package,
  ShieldCheck,
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
    searchParams.get('order_id') ||
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-gray-200/90 p-7 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-950">
            Confirmando tu pago...
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Estamos validando la acreditación con {gateway === 'MOBBEX' ? 'Mobbex' : 'la pasarela de pagos'}. No cierres esta ventana.
          </p>
          {attemptCount > 0 && (
            <p className="text-xs text-gray-400 mt-4 font-mono bg-gray-50 py-1.5 px-3 rounded-lg inline-block">
              Sincronizando comprobante ({attemptCount}/{MAX_POLL_ATTEMPTS})...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'APPROVED') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xs border border-gray-200/90 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-[#00A859]" />
          </div>

          <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-[#00A859] border border-emerald-200 rounded-full mb-2">
            Pago Aprobado
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            ¡Pago Aprobado!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Tu pedido{' '}
            <strong className="font-mono text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
              #ORD-{orderData?.id.slice(0, 8).toUpperCase()}
            </strong>{' '}
            ya está confirmado y en preparación.
          </p>

          {orderData && (
            <div className="mt-6 bg-[#F8FAFC] rounded-xl p-4 text-left text-xs sm:text-sm border border-gray-200/80 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total abonado:</span>
                <span className="font-mono font-extrabold text-base text-gray-950">
                  ${orderData.total_amount.toLocaleString('es-AR')} ARS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Medio de pago:</span>
                <span className="font-bold text-gray-900">
                  {orderData.payment_method || gateway}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Artículos:</span>
                <span className="font-semibold text-gray-900">
                  {orderData.items_count}{' '}
                  {orderData.items_count === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderData?.id && (
              <Link
                href={`/mis-compras?orderId=${encodeURIComponent(orderData.id)}`}
                className="w-full bg-[#0056D2] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs"
              >
                <Package className="w-4 h-4" />
                <span>Seguir mi Pedido</span>
              </Link>
            )}
            <button
              onClick={() => router.push('/')}
              className={`w-full bg-gray-950 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer ${
                !orderData?.id ? 'sm:col-span-2' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Volver a la Tienda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'PENDING_WEBHOOK') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-gray-200/90 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-9 h-9 text-amber-600" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950">
            Pago en Proceso de Acreditación
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            Registramos tu operación{' '}
            {orderData && (
              <strong className="font-mono text-gray-950">
                #ORD-{orderData.id.slice(0, 8).toUpperCase()}
              </strong>
            )}
            . La pasarela está terminando de confirmar la acreditación bancaria; te notificaremos apenas impacte.
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#0056D2] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verificar Nuevamente</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
            >
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-gray-200/90 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-9 h-9 text-red-600" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950">
          {viewState === 'NOT_FOUND'
            ? 'No pudimos ubicar la orden'
            : 'El pago no pudo completarse'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
          {viewState === 'NOT_FOUND'
            ? 'El enlace de retorno no contiene un identificador de orden válido.'
            : 'La operación fue rechazada o cancelada antes de finalizar. Conservamos los productos en tu carrito para que puedas reintentar.'}
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            onClick={handleReturnToCart}
            className="w-full bg-[#0056D2] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Carrito y Reintentar</span>
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-500 hover:text-gray-900 font-bold py-2 text-xs transition-colors cursor-pointer"
          >
            Seguir viendo productos
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A859]" />
          <span>No se efectuó ningún cargo sobre tu medio de pago</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="w-8 h-8 text-[#0056D2] animate-spin" />
        </div>
      }
    >
      <CheckoutResultContent />
    </Suspense>
  );
}