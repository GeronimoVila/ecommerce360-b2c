import { Product } from '@/src/types/product';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const basePrice = Number(product.base_price);
  const discountPlan = product.dynamic_pricing?.cash_transfer;
  const creditPlans = product.dynamic_pricing?.credit_card || [];
  const displayPrice = discountPlan ? discountPlan.final_total : basePrice;
  const bestInstallment = creditPlans.length > 0 ? creditPlans[creditPlans.length - 1] : null;

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0] || null;

  return (
    <div className="flex flex-col h-full p-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md">
      <Link
        href={`/productos/${product.id}`}
        className="group relative block w-full h-48 mb-4 overflow-hidden bg-gray-100 rounded-md"
      >
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-sm text-gray-400">Sin Imagen</span>
          </div>
        )}
      </Link>

      <div className="flex flex-wrap gap-2 mb-3">
        {product.category && (
          <Link
            href={`/?category=${product.category.slug}`}
            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {product.category.name}
          </Link>
        )}
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

      <Link href={`/productos/${product.id}`} className="hover:text-blue-600 transition-colors">
        <h3 className="mb-1 text-lg font-medium text-gray-900 leading-tight">{product.name}</h3>
      </Link>
      <p className="mb-4 text-xs text-gray-500">SKU: {product.sku}</p>

      <div className="mt-auto">
        {discountPlan && (
          <p className="text-sm text-gray-400 line-through">${basePrice.toLocaleString('es-AR')}</p>
        )}
        <p className="text-2xl font-bold text-gray-900">${displayPrice.toLocaleString('es-AR')}</p>

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

      <div className="flex gap-2 mt-5">
        <AddToCartButton
          productId={product.id}
          quantity={1}
          maxStock={product.physical_stock}
          disabled={product.physical_stock <= 0}
        />
        <Link
          href={`/productos/${product.id}`}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded hover:bg-gray-50"
        >
          Ver
        </Link>
      </div>
    </div>
  );
}