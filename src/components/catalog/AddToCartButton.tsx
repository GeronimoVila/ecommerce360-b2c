"use client";

import { useState } from 'react';
import { useCartStore } from '@/src/store/cartStore';

export interface AddToCartProps {
  productId: string;
  quantity: number;
  maxStock: number;
  disabled?: boolean;
}

export default function AddToCartButton({ productId, quantity, maxStock, disabled }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (quantity > maxStock) {
      console.warn('Intento de vulneración de stock bloqueado por exceso de cantidad.');
      return;
    }

    if (maxStock <= 0) {
      return;
    }

    addItem({
      productId,
      quantity,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const isDisabled = disabled || maxStock <= 0 || isSyncing;

  return (
    <button 
      onClick={handleAdd}
      disabled={isDisabled}
      className={`w-full py-3 px-4 rounded font-medium text-white transition-all duration-200 shadow-sm ${
        isDisabled 
          ? 'bg-gray-400 cursor-not-allowed' 
          : isAdded
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isDisabled 
        ? 'Sin Stock' 
        : isAdded 
          ? '✓ ¡Agregado al Carrito!' 
          : isSyncing 
            ? 'Sincronizando...' 
            : 'Agregar al Carrito'}
    </button>
  );
}