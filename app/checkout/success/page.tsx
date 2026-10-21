'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/app/store/cartStore';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clearCart = useCartStore((state) => state.clearCart);

    const status = searchParams.get('status');
    const orderId = searchParams.get('external_reference');
    const paymentId = searchParams.get('payment_id');

    useEffect(() => {
        if (status === 'approved') {
            clearCart();
        }
    }, [status, clearCart]);

    if (status !== 'approved') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-red-600">Estado de pago pendiente o fallido</h1>
                <p>Tu orden {orderId} no ha sido aprobada aún o el pago fue rechazado.</p>
                <button onClick={() => router.push('/checkout')} className="mt-4 px-4 py-2 bg-black text-white rounded">
                    Volver al Checkout
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h1>
                <p className="text-gray-600 mb-6">
                    Tu orden <strong>#{orderId?.split('-')[0]}</strong> ha sido procesada correctamente.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-700 mb-8 border border-gray-200">
                    <p className="font-semibold mb-2">Próximos pasos:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Recibirás un email con el comprobante.</li>
                        <li>Notificaremos al vendedor asignado.</li>
                        <li>Te enviaremos el seguimiento del envío en breve.</li>
                    </ul>
                </div>

                <button 
                    onClick={() => router.push('/')}
                    className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition duration-200"
                >
                    Seguir Comprando
                </button>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Cargando confirmación...</div>}>
            <SuccessContent />
        </Suspense>
    );
}