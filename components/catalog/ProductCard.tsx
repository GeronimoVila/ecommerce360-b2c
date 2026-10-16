import { Product } from '@/types/product';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const basePrice = Number(product.base_price);
  const discountPlan = product.dynamic_pricing?.cash_transfer;
  const creditPlans = product.dynamic_pricing?.credit_card || [];
  const displayPrice = discountPlan ? discountPlan.final_total : basePrice;
  const bestInstallment = creditPlans.length > 0 
    ? creditPlans[creditPlans.length - 1] 
    : null;

  return (
    <div className="flex flex-col h-full p-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md">
      <div className="flex items-center justify-center w-full h-48 mb-4 bg-gray-100 rounded-md">
        <span className="text-sm text-gray-400">Imagen del Producto</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {product.is_combo && (
          <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded">
            Combo Especial
          </span>
        )}
        {discountPlan && (
          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
            {discountPlan.discount_percentage}% OFF
          </span>
        )}
      </div>

      <h3 className="mb-1 text-lg font-medium text-gray-900 leading-tight">{product.name}</h3>
      <p className="mb-4 text-xs text-gray-500">SKU: {product.sku}</p>

      <div className="mt-auto">
        {discountPlan && (
          <p className="text-sm text-gray-400 line-through">
            ${basePrice.toLocaleString('es-AR')}
          </p>
        )}
        
        <p className="text-2xl font-bold text-gray-900">
          ${displayPrice.toLocaleString('es-AR')}
        </p>

        {bestInstallment && (
          <p className="mt-1 text-sm font-medium text-blue-600">
            o {bestInstallment.installments} cuotas de ${bestInstallment.installment_amount.toLocaleString('es-AR')}
          </p>
        )}

        {product.physical_stock > 0 && product.physical_stock <= 3 && (
          <p className="mt-2 text-xs font-medium text-red-600">
            ¡Últimas {product.physical_stock} unidades!
          </p>
        )}
      </div>

      <Link 
        href={`/productos/${product.id}`} 
        className="w-full py-2 mt-5 text-sm font-medium text-center text-white transition-colors bg-black rounded-md hover:bg-gray-800"
      >
        Ver Opciones
      </Link>
    </div>
  );
}