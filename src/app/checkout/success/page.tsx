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
    const cartClearedRef = useRef(false);

    const normalizedOutcome = rawOutcome.toLowerCase();
    const isExplicitFailure = ['failure', 'rejected', 'cancelled', 'null'].includes(normalizedOutcome);

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
    }, [orderId, isExplicitFailure, normalizedOutcome, clearCart]);

    const handleReturnToCart = () => {
        router.push('/');
        setTimeout(() => openDrawer(), 150);
    };

    if (viewState === 'VERIFYING') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900">
                        Confirmando tu pago...
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Estamos verificando la acreditación con{' '}
                        {gateway === 'MOBBEX' ? 'Mobbex' : 'la pasarela de pagos'}. Por favor no cierres esta pestaña.
                    </p>
                    {attemptCount > 0 && (
                        <p className="text-xs text-gray-400 mt-4 font-mono">
                            Sincronizando comprobante ({attemptCount}/{MAX_POLL_ATTEMPTS})...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (viewState === 'APPROVED') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                        ¡Pago Exitoso!
                    </h1>
                    <p className="text-gray-600 text-sm mb-6">
                        Tu orden{' '}
                        <strong className="font-mono text-gray-900">
                            #ORD-{orderData?.id.split('-')[0].toUpperCase()}
                        </strong>{' '}
                        ha sido procesada y confirmada correctamente.
                    </p>

                    {orderData && (
                        <div className="bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-700 mb-6 border border-gray-200 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total abonado:</span>
                                <span className="font-mono font-bold text-gray-900">
                                    ${orderData.total_amount.toLocaleString('es-AR')} ARS
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Medio de pago:</span>
                                <span className="font-semibold text-gray-800">
                                    {orderData.payment_method || gateway}
                                </span>
                            </div>
                            {paymentId && paymentId !== 'null' && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ID Operación:</span>
                                    <span className="font-mono text-xs text-gray-700">
                                        {paymentId}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Artículos:</span>
                                <span className="font-medium text-gray-800">
                                    {orderData.items_count}{' '}
                                    {orderData.items_count === 1 ? 'producto' : 'productos'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="bg-emerald-50/60 rounded-xl p-4 text-left text-xs text-emerald-900 mb-7 border border-emerald-100">
                        <p className="font-bold mb-1.5">Próximos pasos:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Recibirás un email con el detalle de tu compra.</li>
                            <li>El stock de tus productos ya quedó reservado y asignado.</li>
                            <li>Te notificaremos cuando el pedido sea despachado.</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-9 h-9 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                        Pago en Proceso de Acreditación
                    </h1>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        Registramos tu operación{' '}
                        {orderData && (
                            <strong className="font-mono text-gray-900">
                                #ORD-{orderData.id.split('-')[0].toUpperCase()}
                            </strong>
                        )}
                        . La pasarela está terminando de confirmar la acreditación bancaria; tu pedido se actualizará automáticamente en unos instantes.
                    </p>

                    <div className="space-y-2.5">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-200 flex items-center justify-center gap-2 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Verificar Nuevamente
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition duration-200 text-sm"
                        >
                            Seguir Comprando
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-9 h-9 text-rose-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                    {viewState === 'NOT_FOUND'
                        ? 'Orden no encontrada'
                        : 'El pago no pudo completarse'}
                </h1>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    {viewState === 'NOT_FOUND'
                        ? 'No recibimos un identificador de orden válido desde la pasarela.'
                        : 'La operación fue rechazada o cancelada antes de finalizar. Conservamos los productos en tu carrito para que puedas reintentar.'}
                </p>

                <div className="space-y-2.5">
                    <button
                        onClick={handleReturnToCart}
                        className="w-full bg-black text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Carrito y Reintentar
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full text-gray-500 hover:text-gray-800 font-semibold py-2 text-xs transition duration-200"
                    >
                        Seguir viendo productos
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}