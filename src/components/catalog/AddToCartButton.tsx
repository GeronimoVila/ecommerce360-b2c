"use client";

import { useState } from 'react';
import { ShoppingCart, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '@/src/store/cartStore';

export interface AddToCartProps {
  productId: string;
  quantity: number;
  maxStock: number;
  disabled?: boolean;
  variant?: 'default' | 'combo';
  label?: string;
}

export default function AddToCartButton({
  productId,
  quantity,
  maxStock,
  disabled,
  variant = 'default',
  label,
}: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (quantity > maxStock || maxStock <= 0) return;

    addItem({ productId, quantity });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const isDisabled = disabled || maxStock <= 0 || isSyncing;
  const defaultLabel = variant === 'combo' ? 'Comprar Combo' : 'Agregar al Carrito';

  const colorClasses = isDisabled
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : isAdded
    ? 'bg-[#00A859] text-white'
    : variant === 'combo'
    ? 'bg-[#EA580C] hover:bg-orange-700 text-white'
    : 'bg-[#0056D2] hover:bg-blue-700 text-white';

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer ${colorClasses}`}
    >
      {isDisabled ? (
        <span>Sin Stock</span>
      ) : isAdded ? (
        <>
          <Check className="w-4 h-4" />
          <span>¡Agregado!</span>
        </>
      ) : isSyncing ? (
        <span>Sincronizando...</span>
      ) : (
        <>
          {variant === 'combo' ? (
            <ShoppingBag className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span>{label || defaultLabel}</span>
        </>
      )}
    </button>
  );
}