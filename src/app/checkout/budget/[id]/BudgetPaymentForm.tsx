'use client';

import { useState, useMemo, useActionState } from 'react';
import {
  CreditCard,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

export interface PaymentActionState {
  error?: string;
  details?: string;
}

export interface BudgetInstallmentOption {
  gateway: 'MP' | 'MOBBEX';
  installments: number;
  interest_percentage: number;
}

interface BudgetPaymentFormProps {
  defaultMethod: 'MP' | 'MOBBEX';
  defaultInstallments?: number;
  baseTotal?: number;
  availablePlans?: BudgetInstallmentOption[];
  action: (prevState: PaymentActionState, formData: FormData) => Promise<PaymentActionState>;
}

const DEFAULT_FALLBACK_INSTALLMENTS = [1, 3, 6, 12];

export function BudgetPaymentForm({
  defaultMethod,
  defaultInstallments = 1,
  baseTotal,
  availablePlans,
  action,
}: BudgetPaymentFormProps) {
  const [state, formAction, isPending] = useActionState<PaymentActionState, FormData>(action, {});
  const [selectedMethod, setSelectedMethod] = useState<'MP' | 'MOBBEX'>(defaultMethod);
  const [selectedInstallments, setSelectedInstallments] = useState<number>(
    Math.max(1, Number(defaultInstallments) || 1)
  );

  const installmentOptions = useMemo(() => {
    if (availablePlans && availablePlans.length > 0) {
      const map = new Map<number, number>();
      map.set(1, 0);
      for (const plan of availablePlans) {
        if (plan.gateway === selectedMethod) {
          map.set(plan.installments, plan.interest_percentage);
        }
      }
      return Array.from(map.entries())
        .map(([installments, interestPercentage]) => ({
          installments,
          interestPercentage,
          hasKnownRate: true,
        }))
        .sort((a, b) => a.installments - b.installments);
    }

    const baseSet = new Set<number>(DEFAULT_FALLBACK_INSTALLMENTS);
    if (selectedInstallments > 1) baseSet.add(selectedInstallments);

    return Array.from(baseSet)
      .sort((a, b) => a - b)
      .map((installments) => ({
        installments,
        interestPercentage: 0,
        hasKnownRate: false,
      }));
  }, [availablePlans, selectedMethod, selectedInstallments]);

  const activePlan =
    installmentOptions.find((opt) => opt.installments === selectedInstallments) ||
    installmentOptions[0];

  const estimatedTotal = useMemo(() => {
    if (!baseTotal || baseTotal <= 0) return null;
    if (!activePlan || !activePlan.hasKnownRate) return baseTotal;
    return Math.round(baseTotal * (1 + activePlan.interestPercentage / 100) * 100) / 100;
  }, [baseTotal, activePlan]);

  const handleMethodChange = (nextMethod: 'MP' | 'MOBBEX') => {
    setSelectedMethod(nextMethod);
    if (availablePlans && availablePlans.length > 0) {
      const validForMethod = availablePlans.some(
        (p) => p.gateway === nextMethod && p.installments === selectedInstallments
      );
      if (!validForMethod && selectedInstallments !== 1) {
        setSelectedInstallments(1);
      }
    }
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="paymentMethod" value={selectedMethod} />
      <input type="hidden" name="installments" value={selectedInstallments} />

      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{state.error}</p>
            {state.details && <p className="text-xs text-red-700 mt-0.5">{state.details}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
          Seleccioná la Pasarela de Pago
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleMethodChange('MOBBEX')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              selectedMethod === 'MOBBEX'
                ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <CreditCard
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                selectedMethod === 'MOBBEX' ? 'text-[#0056D2]' : 'text-gray-400'
              }`}
            />
            <div>
              <p className="text-sm font-bold text-gray-950">Mobbex</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Crédito, Débito, Cuotas y QR
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleMethodChange('MP')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              selectedMethod === 'MP'
                ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <Wallet
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                selectedMethod === 'MP' ? 'text-[#0056D2]' : 'text-gray-400'
              }`}
            />
            <div>
              <p className="text-sm font-bold text-gray-950">Mercado Pago</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Dinero en cuenta o tarjetas
              </p>
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
          Plan de Cuotas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {installmentOptions.map((opt) => {
            const isSelected = opt.installments === selectedInstallments;
            const subtitle =
              opt.installments === 1
                ? 'Sin interés'
                : opt.hasKnownRate
                ? opt.interestPercentage === 0
                  ? 'Sin interés'
                  : `+${opt.interestPercentage}% financiación`
                : 'Cuotas fijas';

            return (
              <button
                key={opt.installments}
                type="button"
                disabled={isPending}
                onClick={() => setSelectedInstallments(opt.installments)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {opt.installments === 1 ? '1 pago' : `${opt.installments} cuotas`}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      opt.installments === 1 || opt.interestPercentage === 0
                        ? 'text-[#00A859]'
                        : 'text-amber-700'
                    }`}
                  >
                    {subtitle}
                  </p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0056D2] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {estimatedTotal !== null && (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between gap-3 text-sm">
          <div>
            <span className="font-bold text-gray-950 block">Total estimado a abonar</span>
            {selectedInstallments > 1 && (
              <span className="text-xs font-semibold text-[#0056D2]">
                {selectedInstallments} cuotas de $
                {(estimatedTotal / selectedInstallments).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
          <span className="font-mono font-extrabold text-base sm:text-lg text-gray-950 shrink-0">
            ${estimatedTotal.toLocaleString('es-AR')} ARS
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#2E7D5B] hover:bg-[#236347] disabled:bg-gray-300 text-white font-bold py-4 px-5 rounded-xl shadow-xs transition-all flex justify-center items-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Iniciando pasarela de pago...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Proceder al Pago Seguro</span>
          </>
        )}
      </button>
    </form>
  );
}