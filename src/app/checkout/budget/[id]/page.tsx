import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Package,
} from 'lucide-react';
import {
  BudgetPaymentForm,
  type PaymentActionState,
  type BudgetInstallmentOption,
} from './BudgetPaymentForm';

interface BudgetPageProps {
  params: Promise<{ id: string }>;
}

function BudgetSkeleton() {
  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 bg-white shadow-xs rounded-2xl mt-8 border border-gray-200/90 animate-pulse space-y-5">
      <div className="h-7 bg-gray-200 rounded-lg w-2/3" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-14 bg-gray-100 rounded-xl" />
      <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
  );
}

async function BudgetDetails({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const returnPath = `/checkout/budget/${id}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const meRes = await fetch(`${apiUrl}/api/v1/users/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!meRes.ok) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const meData = await meRes.json().catch(() => null);
  const currentUser = meData?.user || meData;

  if (!currentUser || currentUser.role !== 'CUSTOMER') {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const endpoint = `${apiUrl}/api/v1/checkout/budget/${id}`;
  const res = await fetch(endpoint, { cache: 'no-store' });

  if (!res.ok) {
    if (res.status === 404 || res.status === 410) {
      return notFound();
    }
    throw new Error(`Error crítico del servidor backend: ${res.status}`);
  }

  const data = await res.json();
  const budget = data.budget;
  const availablePlans: BudgetInstallmentOption[] | undefined = data.availablePlans;

  const savedInstallments = Number(
    budget.installments ?? budget.shipping_address?.installments ?? 1
  );
  const defaultInstallments =
    Number.isFinite(savedInstallments) && savedInstallments > 0 ? savedInstallments : 1;

  const baseTotal = Array.isArray(budget.items)
    ? budget.items.reduce((acc: number, item: any) => {
        const unitBase = Number(item.pure_base_price ?? item.unit_price) || 0;
        return acc + unitBase * Number(item.quantity || 0);
      }, 0)
    : Number(budget.total_amount) || 0;

  async function processPayment(
    _prevState: PaymentActionState,
    formData: FormData
  ): Promise<PaymentActionState> {
    'use server';
    const chosenMethod =
      (formData.get('paymentMethod') as string) || budget.payment_method || 'MOBBEX';
    const rawInstallments = Number(formData.get('installments'));
    const chosenInstallments =
      Number.isFinite(rawInstallments) && rawInstallments > 0
        ? Math.floor(rawInstallments)
        : defaultInstallments;

    const actionCookies = (await cookies()).toString();

    let payData: any = {};
    let isOk = false;
    let status = 500;

    try {
      const payRes = await fetch(`${apiUrl}/api/v1/checkout/budget/${id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: actionCookies,
        },
        body: JSON.stringify({
          paymentMethod: chosenMethod,
          installments: chosenInstallments,
        }),
        cache: 'no-store',
      });

      status = payRes.status;
      isOk = payRes.ok;
      payData = await payRes.json().catch(() => ({}));
    } catch (err) {
      console.error('[BudgetCheckoutPage] Error de red al contactar pasarela:', err);
      return {
        error: 'No se pudo conectar con el servidor de pagos.',
        details: 'Verificá tu conexión e intentá nuevamente en unos segundos.',
      };
    }

    if (status === 401) {
      redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
    }

    if (isOk && payData.checkoutUrl) {
      redirect(payData.checkoutUrl);
    }

    return {
      error: payData.error || 'Fallo al inicializar la pasarela de pago.',
      details: payData.details,
    };
  }

  const defaultMethod = budget.payment_method === 'MP' ? 'MP' : 'MOBBEX';

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-10 space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </Link>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00A859] bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cotización Oficial
        </div>
      </div>

      <div className="bg-white shadow-xs rounded-2xl border border-gray-200/90 p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                Resumen de Presupuesto
              </h1>
              <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                ID: {budget.id}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-[#00A859] border border-emerald-200/80 px-3 py-1 rounded-full font-bold self-start">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-47.5">{currentUser.email}</span>
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            Detalle de Productos Cotizados
          </h2>
          <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl px-4 bg-[#F8FAFC]/60">
            {budget.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center gap-3 text-xs sm:text-sm py-3.5"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 line-clamp-2">
                      {item.product?.name || 'Producto'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Unidades: <strong className="text-gray-700">{item.quantity}</strong> × $
                      {Number(item.unit_price).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-gray-950 shrink-0">
                  ${Number(item.unit_price * item.quantity).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-gray-200/80 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-gray-950 block">
              Total Presupuestado
            </span>
            {defaultInstallments > 1 && (
              <span className="text-xs text-gray-500">
                Condición sugerida: {defaultMethod} · {defaultInstallments} cuotas
              </span>
            )}
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#00A859] tracking-tight">
            ${Number(budget.total_amount).toLocaleString('es-AR')}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/90 py-2.5 px-3.5 rounded-xl">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Oferta válida hasta el {new Date(budget.expires_at).toLocaleString('es-AR')}
          </span>
        </div>

        <BudgetPaymentForm
          defaultMethod={defaultMethod}
          defaultInstallments={defaultInstallments}
          baseTotal={baseTotal}
          availablePlans={availablePlans}
          action={processPayment}
        />
      </div>
    </div>
  );
}

export default function BudgetCheckoutPage({ params }: BudgetPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 sm:px-6">
      <Suspense fallback={<BudgetSkeleton />}>
        <BudgetDetails paramsPromise={params} />
      </Suspense>
    </div>
  );
}