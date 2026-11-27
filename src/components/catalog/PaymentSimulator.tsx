"use client";

import { useState } from 'react';
import { Landmark, CreditCard, CheckCircle2 } from 'lucide-react';
import { DynamicPricing } from '@/src/types/product';

interface PaymentSimulatorProps {
  pricing?: DynamicPricing;
  basePrice: number;
}

export default function PaymentSimulator({ pricing, basePrice }: PaymentSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'efectivo' | 'tarjeta'>('efectivo');

  if (!pricing) return null;

  return (
    <div className="w-full mt-5 border border-gray-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 border-b border-gray-200/80 bg-[#F8FAFC]">
        <button
          type="button"
          onClick={() => setActiveTab('efectivo')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'efectivo'
              ? 'text-[#00A859] bg-white border-b-2 border-[#00A859]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0" />
          <span>Contado / Transferencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tarjeta')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tarjeta'
              ? 'text-[#0056D2] bg-white border-b-2 border-[#0056D2]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Tarjetas de Crédito</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 bg-white">
        {activeTab === 'efectivo' && (
          <div>
            {pricing.cash_transfer ? (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#00A859] rounded-md">
                    {pricing.cash_transfer.discount_percentage}% OFF CONTADO
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-black text-[#00A859] tracking-tight">
                      ${pricing.cash_transfer.final_total.toLocaleString('es-AR')}
                    </p>
                    <span className="text-xs font-bold text-[#00A859]">Final</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-through">
                    Precio de lista: ${basePrice.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="text-xs text-emerald-900 space-y-1 sm:text-right">
                  <p className="font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00A859]" />
                    Ahorrás ${(basePrice - pricing.cash_transfer.final_total).toLocaleString('es-AR')}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Acreditación inmediata por CBU/Alias
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center">
                <p className="text-2xl font-extrabold text-gray-950">
                  ${basePrice.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Precio final abonando por transferencia o efectivo.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tarjeta' && (
          <div>
            {pricing.credit_card && pricing.credit_card.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {pricing.credit_card.map((plan, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {plan.installments === 1
                          ? '1 pago con tarjeta'
                          : `${plan.installments} cuotas fijas`}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          plan.interest_percentage === 0
                            ? 'text-[#00A859]'
                            : 'text-gray-500'
                        }`}
                      >
                        {plan.interest_percentage === 0
                          ? 'Sin interés'
                          : `Financiación (${plan.gateway})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-extrabold text-[#0056D2]">
                        ${plan.installment_amount.toLocaleString('es-AR')}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Total: ${plan.final_total.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-gray-500 text-xs sm:text-sm">
                Las promociones bancarias y cuotas dependen del metodo de pago.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}