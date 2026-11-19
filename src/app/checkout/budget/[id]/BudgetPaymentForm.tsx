'use client';

import { useActionState } from 'react';

export interface PaymentActionState {
  error?: string;
  details?: string;
}

interface BudgetPaymentFormProps {
  defaultMethod: 'MP' | 'MOBBEX';
  action: (prevState: PaymentActionState, formData: FormData) => Promise<PaymentActionState>;
}

export function BudgetPaymentForm({ defaultMethod, action }: BudgetPaymentFormProps) {
  const [state, formAction, isPending] = useActionState<PaymentActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm space-y-1"
        >
          <p className="font-bold">{state.error}</p>
          {state.details && <p className="text-xs text-red-700">{state.details}</p>}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Pasarela de Pago
        </label>
        <select
          name="paymentMethod"
          defaultValue={defaultMethod}
          disabled={isPending}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 disabled:opacity-60"
        >
          <option value="MOBBEX">Mobbex (Tarjetas de Crédito / Débito / Cuotas / QR)</option>
          <option value="MP">Mercado Pago</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? 'Iniciando pasarela de pago...' : 'Proceder al Pago Seguro'}
      </button>
    </form>
  );
}