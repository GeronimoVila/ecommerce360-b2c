import { Product } from '@/types/product';
import Image from 'next/image';

export default function ProductCard({ product }: { product: Product }) {
  const isLowStock = product.physical_stock > 0 && product.physical_stock <= 3;
  const isOutOfStock = product.physical_stock === 0;

  return (
    <div className="group relative border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
      {product.is_combo && (
        <span className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
          KIT AHORRO
        </span>
      )}
      
      <div className="aspect-square bg-gray-100 rounded-md mb-4 relative overflow-hidden">
      </div>

      <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
      <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-lg font-bold text-gray-900">
          ${parseFloat(product.base_price).toLocaleString('es-AR')}
        </span>
        
        {isOutOfStock ? (
          <span className="text-xs font-semibold text-red-500">Sin stock</span>
        ) : isLowStock ? (
          <span className="text-xs font-semibold text-orange-500">¡Últimas {product.physical_stock}!</span>
        ) : (
          <span className="text-xs text-green-600">Disponible</span>
        )}
      </div>

      <button 
        disabled={isOutOfStock}
        className="w-full mt-4 bg-black text-white py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Agregar al carrito
      </button>
    </div>
  );
}