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
  Copy,
  Check,
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

type ViewState =
  | 'VERIFYING'
  | 'APPROVED'
  | 'TRANSFER_PENDING'
  | 'PENDING_WEBHOOK'
  | 'REJECTED'
  | 'NOT_FOUND';

const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    '';
  const gateway = searchParams.get('gateway') || 'PASARELA';
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const rawOutcome =
    searchParams.get('outcome') ||
    searchParams.get('status') ||
    searchParams.get('collection_status') ||
    '';

  const [viewState, setViewState] = useState<ViewState>('VERIFYING');
  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const cartClearedRef = useRef(false);

  const normalizedOutcome = rawOutcome.toLowerCase();
  const isExplicitFailure = ['failure', 'rejected', 'cancelled', 'null'].includes(normalizedOutcome);
  const bankAlias = process.env.NEXT_PUBLIC_BANK_ALIAS || 'LEGADOHOGAR.PAGOS';

  useEffect(() => {
    if (!orderId) {
      setViewState('NOT_FOUND');
      return;
    }

    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const verifyOrderStatus = async (attempt: number) => {
      try {
        const data = await coreFetch<OrderStatusResponse>(
          `/api/v1/orders/${encodeURIComponent(orderId)}/status`
        );

        if (isCancelled) return;
        setOrderData(data);

        if (
          data.status === 'PENDING' &&
          (gateway.toUpperCase() === 'TRANSFERENCIA' || data.payment_method === 'TRANSFERENCIA')
        ) {
          if (!cartClearedRef.current) {
            clearCart();
            cartClearedRef.current = true;
          }
          setViewState('TRANSFER_PENDING');
          return;
        }

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
          if (normalizedOutcome === 'approved' && !cartClearedRef.current) {
            clearCart();
            cartClearedRef.current = true;
          }
          setViewState('PENDING_WEBHOOK');
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('[CheckoutSuccess] Error verificando estado de orden:', error);
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
  }, [orderId, gateway, isExplicitFailure, normalizedOutcome, clearCart]);

  const handleReturnToCart = () => {
    router.push('/');
    setTimeout(() => openDrawer(), 150);
  };

  const handleCopyAlias = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bankAlias);
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    }
  };

  if (viewState === 'VERIFYING') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-gray-200/90 p-7 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-950">
            Confirmando tu pago...
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Estamos verificando la acreditación con{' '}
            {gateway === 'MOBBEX' ? 'Mobbex' : 'la pasarela de pagos'}. Por favor no cierres esta pestaña.
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
    const shortOrder = orderData?.id.split('-')[0].toUpperCase();
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] py-10 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xs p-6 sm:p-8 text-center border border-gray-200/90">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-[#00A859]" />
          </div>
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-[#00A859] border border-emerald-200 rounded-full mb-2">
            Pago Acreditado
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            ¡Compra Confirmada!
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">
            Tu orden{' '}
            <strong className="font-mono text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
              #ORD-{shortOrder}
            </strong>{' '}
            fue procesada y tu stock ya quedó reservado.
          </p>

          {orderData && (
            <div className="mt-6 bg-[#F8FAFC] rounded-xl p-4 text-left text-xs sm:text-sm text-gray-700 border border-gray-200/80 space-y-2.5">
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
              {paymentId && paymentId !== 'null' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ID Operación:</span>
                  <span className="font-mono text-xs text-gray-800">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Artículos:</span>
                <span className="font-semibold text-gray-900">
                  {orderData.items_count}{' '}
                  {orderData.items_count === 1 ? 'producto' : 'productos'}
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

  if (viewState === 'TRANSFER_PENDING') {
    const shortOrder = orderData?.id.split('-')[0].toUpperCase();
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] py-10 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xs p-6 sm:p-8 text-center border border-gray-200/90">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-[#00A859]" />
          </div>
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-[#00A859] border border-emerald-200 rounded-full mb-2">
            Stock Reservado
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            ¡Pedido Registrado!
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">
            Tu orden{' '}
            <strong className="font-mono text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
              #ORD-{shortOrder}
            </strong>{' '}
            quedó reservada a la espera de tu transferencia bancaria.
          </p>

          {orderData && (
            <div className="mt-6 bg-[#F8FAFC] rounded-xl p-4 text-left text-xs sm:text-sm text-gray-700 border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Monto exacto a transferir:</span>
                <span className="font-mono font-extrabold text-base text-[#00A859]">
                  ${orderData.total_amount.toLocaleString('es-AR')} ARS
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/70">
                <div>
                  <span className="text-gray-500 block text-xs">Alias Bancario:</span>
                  <span className="font-mono font-extrabold text-gray-950">{bankAlias}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAlias}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-800 transition-colors cursor-pointer shrink-0"
                >
                  {copiedAlias ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00A859]" />
                      <span className="text-[#00A859]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#0056D2]" />
                      <span>Copiar Alias</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200/70">
                <span className="text-gray-500">Referencia / Concepto:</span>
                <span className="font-mono font-bold text-xs text-gray-900">
                  ORD-{shortOrder}
                </span>
              </div>
            </div>
          )}

          <div className="mt-5 bg-emerald-50/70 rounded-xl p-4 text-left text-xs text-emerald-950 border border-emerald-200/80">
            <p className="font-bold text-[#00A859] mb-1.5">Cómo completar el pago:</p>
            <ul className="list-disc pl-4 space-y-1 text-emerald-900">
              <li>Realizá la transferencia por el monto exacto indicado arriba.</li>
              <li>Incluí el número de orden en el concepto o referencia bancaria.</li>
              <li>Una vez acreditada, confirmaremos tu pedido y coordinaremos la entrega.</li>
            </ul>
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderData?.id && (
              <Link
                href={`/mis-compras?orderId=${encodeURIComponent(orderData.id)}`}
                className="w-full bg-[#0056D2] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs"
              >
                <Package className="w-4 h-4" />
                <span>Ver en Mis Compras</span>
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xs p-6 sm:p-8 text-center border border-gray-200/90">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-9 h-9 text-amber-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 mb-2">
            Pago en Proceso de Acreditación
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
            Registramos tu operación{' '}
            {orderData && (
              <strong className="font-mono text-gray-950">
                #ORD-{orderData.id.split('-')[0].toUpperCase()}
              </strong>
            )}
            . La pasarela está terminando de confirmar la acreditación bancaria; tu pedido se actualizará automáticamente en unos instantes.
          </p>

          <div className="space-y-2.5">
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
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xs p-6 sm:p-8 text-center border border-gray-200/90">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-9 h-9 text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 mb-2">
          {viewState === 'NOT_FOUND' ? 'Orden no encontrada' : 'El pago no pudo completarse'}
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
          {viewState === 'NOT_FOUND'
            ? 'No recibimos un identificador de orden válido desde la pasarela.'
            : 'La operación fue rechazada o cancelada antes de finalizar. Conservamos los productos en tu carrito para que puedas reintentar.'}
        </p>

        <div className="space-y-2.5">
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="w-8 h-8 text-[#0056D2] animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}