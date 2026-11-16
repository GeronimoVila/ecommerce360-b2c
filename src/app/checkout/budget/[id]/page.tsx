import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';

interface BudgetPageProps {
  params: Promise<{ id: string }>;
}

function BudgetSkeleton() {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 border border-gray-100 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-6"></div>
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded w-full mt-6"></div>
    </div>
  );
}

async function BudgetDetails({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const endpoint = `${apiUrl}/api/v1/checkout/budget/${id}`;

  const res = await fetch(endpoint, { cache: 'no-store' });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Fetch Error] Endpoint: ${endpoint} | Status: ${res.status} | Respuesta:`, errorText);

    if (res.status === 404 || res.status === 410) {
      return notFound();
    }
    throw new Error(`Error crítico del servidor backend: ${res.status}`);
  }

  const { budget } = await res.json();

  async function processPayment(formData: FormData) {
    'use server';
    const chosenMethod = (formData.get('paymentMethod') as string) || budget.payment_method || 'MOBBEX';

    const payRes = await fetch(`${apiUrl}/api/v1/checkout/budget/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: chosenMethod }),
      cache: 'no-store',
    });

    const payData = await payRes.json();

    if (payData.checkoutUrl) {
      redirect(payData.checkoutUrl);
    } else {
      throw new Error(payData.error || 'Fallo al inicializar la pasarela de pago');
    }
  }

  const defaultMethod = budget.payment_method === 'MP' ? 'MP' : 'MOBBEX';

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 border border-gray-100">
      <div className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Resumen de tu Presupuesto</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">ID de Orden: {budget.id}</p>
      </div>

      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Detalle</h2>
        {budget.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50">
            <div>
              <p className="font-medium text-gray-800">{item.product?.name || 'Producto'}</p>
              <p className="text-xs text-gray-500">Unidades: {item.quantity}</p>
            </div>
            <span className="font-semibold text-gray-700">
              ${Number(item.unit_price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <span className="text-lg font-bold text-gray-900">Total a Pagar:</span>
        <span className="text-2xl font-bold text-green-600">${Number(budget.total_amount).toFixed(2)}</span>
      </div>

      <p className="text-xs text-amber-600 mb-4 text-center font-medium">
        ⚠️ Oferta válida hasta el {new Date(budget.expires_at).toLocaleString()}
      </p>

      <form action={processPayment} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Pasarela de Pago
          </label>
          <select
            name="paymentMethod"
            defaultValue={defaultMethod}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
          >
            <option value="MOBBEX">Mobbex (Tarjetas de Crédito / Débito / Cuotas / QR)</option>
            <option value="MP">Mercado Pago</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all flex justify-center items-center gap-2"
        >
          Proceder al Pago Seguro
        </button>
      </form>
    </div>
  );
}

export default function BudgetCheckoutPage({ params }: BudgetPageProps) {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<BudgetSkeleton />}>
        <BudgetDetails paramsPromise={params} />
      </Suspense>
    </main>
  );
}