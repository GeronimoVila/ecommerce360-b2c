'use client';

import { useState } from 'react';
import { useCartStore } from '../../app/store/cartStore';

interface AddToCartProps {
  productId: string;
  quantity?: number;
}

export default function AddToCartButton({ productId, quantity = 1 }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [feedback, setFeedback] = useState(false);

  const handleAdd = () => {
    addItem({ productId, quantity });
    
    setFeedback(true);
    setTimeout(() => setFeedback(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isSyncing}
      className={`w-full py-2 px-4 rounded transition-colors ${
        feedback 
          ? 'bg-green-600 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
      }`}
    >
      {feedback ? '✓ Añadido' : isSyncing ? 'Sincronizando...' : 'Agregar al Carrito'}
    </button>
  );
}