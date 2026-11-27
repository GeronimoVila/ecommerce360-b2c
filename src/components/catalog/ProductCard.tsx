import Link from 'next/link';
import { Check } from 'lucide-react';
import { Product } from '@/src/types/product';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const basePrice = Number(product.base_price);
  const discountPlan = product.dynamic_pricing?.cash_transfer;
  const creditPlans = product.dynamic_pricing?.credit_card || [];
  const cashPrice = discountPlan ? discountPlan.final_total : basePrice;
  const bestInstallment =
    creditPlans.length > 0 ? creditPlans[creditPlans.length - 1] : null;

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0] || null;

  const isCombo = Boolean(product.is_combo);

  return (
    <article
      className={`flex flex-col h-full rounded-2xl bg-white transition-all duration-200 overflow-hidden ${
        isCombo
          ? 'border-2 border-[#EA580C] shadow-md shadow-orange-500/10'
          : 'border border-gray-200/90 shadow-2xs hover:shadow-md'
      }`}
    >
      <div
        className={`relative p-4 pb-2 ${
          isCombo ? 'bg-orange-50/40' : 'bg-gray-50/60'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2 min-h-6">
          {isCombo ? (
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#EA580C] rounded-md">
              COMBO AHORRO
            </span>
          ) : discountPlan ? (
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#00A859] rounded-md">
              {discountPlan.discount_percentage}% OFF
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#0056D2] rounded-md">
              ENTREGA INMEDIATA
            </span>
          )}
        </div>

        <Link
          href={`/productos/${product.id}`}
          className="group relative flex items-center justify-center w-full h-44 rounded-xl overflow-hidden bg-white"
        >
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-xs text-gray-400">Sin Imagen</span>
          )}
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-5 pt-3">
        <p
          className={`text-[11px] font-semibold mb-1 ${
            isCombo ? 'text-[#EA580C]' : 'text-gray-500'
          }`}
        >
          {isCombo
            ? `Pack Especial (${product.combo_parts?.length || 2} ítems)`
            : product.category?.name || `SKU: ${product.sku}`}
        </p>

        <Link
          href={`/productos/${product.id}`}
          className="hover:text-[#0056D2] transition-colors"
        >
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {isCombo && product.combo_parts && product.combo_parts.length > 0 && (
          <ul className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            {product.combo_parts.slice(0, 3).map((part, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] text-gray-600 leading-tight"
              >
                <Check className="w-3.5 h-3.5 text-[#00A859] shrink-0 mt-0.5" />
                <span className="line-clamp-1">
                  {part.quantity > 1 ? `${part.quantity}x ` : ''}
                  {part.product.name}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#00A859] tracking-tight">
              ${cashPrice.toLocaleString('es-AR')}
            </span>
            <span className="text-xs font-semibold text-[#00A859]">Contado</span>
          </div>

          {bestInstallment ? (
            <p className="text-xs text-gray-500 mt-0.5">
              ${bestInstallment.final_total.toLocaleString('es-AR')} en{' '}
              {bestInstallment.installments} cuotas{' '}
              {bestInstallment.interest_percentage === 0 ? 'sin interés' : 'fijas'}
            </p>
          ) : discountPlan ? (
            <p className="text-xs text-gray-400 line-through mt-0.5">
              Precio lista: ${basePrice.toLocaleString('es-AR')}
            </p>
          ) : null}

          {product.physical_stock > 0 && product.physical_stock <= 3 && (
            <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
              ¡Últimas {product.physical_stock} unidades!
            </p>
          )}
        </div>

        <div className="mt-4">
          <AddToCartButton
            productId={product.id}
            quantity={1}
            maxStock={product.physical_stock}
            disabled={product.physical_stock <= 0}
            variant={isCombo ? 'combo' : 'default'}
          />
        </div>
      </div>
    </article>
  );
}