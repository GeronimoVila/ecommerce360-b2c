"use client";

import { useState } from 'react';
import { DynamicPricing } from '@/types/product';

interface PaymentSimulatorProps {
  pricing?: DynamicPricing;
  basePrice: number;
}

export default function PaymentSimulator({ pricing, basePrice }: PaymentSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'efectivo' | 'tarjeta'>('efectivo');

  if (!pricing) return null;

  return (
    <div className="w-full mt-6 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex w-full border-b border-gray-200">
        <button
          onClick={() => setActiveTab('efectivo')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'efectivo' 
              ? 'text-blue-700 bg-white border-b-2 border-blue-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transferencia / Efectivo
        </button>
        <button
          onClick={() => setActiveTab('tarjeta')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'tarjeta' 
              ? 'text-blue-700 bg-white border-b-2 border-blue-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tarjetas de Crédito
        </button>
      </div>

      <div className="p-4 bg-white rounded-b-lg">
        {activeTab === 'efectivo' && (
          <div className="flex flex-col items-center justify-center p-4">
            {pricing.cash_transfer ? (
              <>
                <span className="inline-block px-3 py-1 mb-2 text-sm font-bold text-green-800 bg-green-100 rounded-full">
                  {pricing.cash_transfer.discount_percentage}% OFF
                </span>
                <p className="text-3xl font-extrabold text-gray-900">
                  ${pricing.cash_transfer.final_total.toLocaleString('es-AR')}
                </p>
                <p className="mt-1 text-sm text-gray-500 line-through">
                  Precio de lista: ${basePrice.toLocaleString('es-AR')}
                </p>
              </>
            ) : (
              <p className="text-gray-600">No hay descuentos configurados para pago al contado.</p>
            )}
          </div>
        )}

        {activeTab === 'tarjeta' && (
          <div className="space-y-3">
            {pricing.credit_card && pricing.credit_card.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {pricing.credit_card.map((plan, index) => (
                  <li key={index} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {plan.installments} cuotas fijas de 
                      </p>
                      <p className="text-xs text-gray-500">
                        {plan.interest_percentage === 0 ? 'Sin interés' : `CFT/TEA aplicado`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ${plan.installment_amount.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-gray-400">
                        Total: ${plan.final_total.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500 text-sm">
                Las promociones bancarias dependen de la pasarela de pago al momento del checkout.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}