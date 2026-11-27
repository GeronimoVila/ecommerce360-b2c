import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
  Check,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { Product } from '@/src/types/product';
import PaymentSimulator from '@/src/components/catalog/PaymentSimulator';
import AddToCartButton from '@/src/components/catalog/AddToCartButton';
import ProductGallery from '@/src/components/catalog/ProductGallery';
import { getCategoryTree, getCategoryBreadcrumbs } from '@/src/services/category.service';

async function getProductDetail(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/storefront/${id}`, {
      next: { revalidate: 60, tags: [`product-${id}`] },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
      <div className="lg:col-span-6 aspect-square bg-white border border-gray-200 rounded-2xl" />
      <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded-full" />
        <div className="h-9 w-3/4 bg-gray-200 rounded-xl" />
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

async function ProductDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = await paramsPromise;

  const [product, categoryTree] = await Promise.all([
    getProductDetail(resolvedParams.id),
    getCategoryTree(),
  ]);

  if (!product) {
    notFound();
  }

  const basePrice = Number(product.base_price);
  const discountPlan = product.dynamic_pricing?.cash_transfer;
  const cashPrice = discountPlan ? discountPlan.final_total : basePrice;
  const isCombo = Boolean(product.is_combo);

  const breadcrumbs = product.category?.slug
    ? getCategoryBreadcrumbs(categoryTree, product.category.slug)
    : [];

  const description = product.description?.trim() || '';
  const technicalSpecs = Array.isArray(product.technical_specs)
    ? product.technical_specs.filter((item) => item?.key?.trim() && item?.value?.trim())
    : [];

  const hasDescription = description.length > 0;
  const hasSpecs = technicalSpecs.length > 0;

  return (
    <div className="space-y-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-2 text-xs text-gray-500"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-[#0056D2] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Inicio
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <span>/</span>
            <Link
              href={`/?category=${crumb.slug}`}
              className="hover:text-[#0056D2] transition-colors"
            >
              {crumb.name}
            </Link>
          </span>
        ))}
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-55 sm:max-w-md">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div
          className={`lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 shadow-xs ${
            isCombo ? 'border-2 border-[#EA580C]' : 'border border-gray-200/90'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isCombo ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#EA580C] rounded-md">
                <Layers className="w-3 h-3" />
                COMBO AHORRO
              </span>
            ) : discountPlan ? (
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#00A859] rounded-md">
                {discountPlan.discount_percentage}% OFF CONTADO
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#0056D2] rounded-md">
                ENTREGA INMEDIATA
              </span>
            )}

            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              SKU: {product.sku}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 leading-snug">
            {product.name}
          </h1>

          <div className="mt-5 pb-5 border-b border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#00A859] tracking-tight">
                ${cashPrice.toLocaleString('es-AR')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#00A859]">
                {discountPlan ? 'Contado / Transferencia' : 'Precio Final'}
              </span>
            </div>

            {discountPlan && (
              <p className="text-xs sm:text-sm text-gray-400 line-through mt-1">
                Precio de lista: ${basePrice.toLocaleString('es-AR')}
              </p>
            )}
          </div>

          <PaymentSimulator pricing={product.dynamic_pricing} basePrice={basePrice} />

          <div className="mt-5">
            {product.physical_stock > 0 ? (
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#00A859] bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {product.physical_stock > 5
                    ? 'Stock disponible para envío inmediato'
                    : `¡Últimas ${product.physical_stock} unidades disponibles!`}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-red-700 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Agotado temporalmente</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <AddToCartButton
              productId={product.id}
              quantity={1}
              maxStock={product.physical_stock}
              disabled={product.physical_stock <= 0}
              variant={isCombo ? 'combo' : 'default'}
            />
          </div>

          {isCombo && product.combo_parts && product.combo_parts.length > 0 && (
            <div className="mt-7 p-4 sm:p-5 rounded-2xl bg-orange-50/50 border border-orange-200/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#EA580C] mb-3">
                Este Combo Ahorro incluye:
              </h3>
              <ul className="space-y-2">
                {product.combo_parts.map((part: any, index: number) => (
                  <li
                    key={index}
                    className="text-xs sm:text-sm text-gray-800 font-medium flex items-start gap-2"
                  >
                    <Check className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
                    <span>
                      <strong>{part.quantity}x</strong> {part.product.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {(hasDescription || hasSpecs) && (
        <div
          className={`grid grid-cols-1 ${
            hasDescription && hasSpecs ? 'lg:grid-cols-12' : ''
          } gap-6 sm:gap-8 items-start`}
        >
          {hasDescription && (
            <section
              className={`${
                hasSpecs ? 'lg:col-span-6' : ''
              } bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs`}
            >
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
                  Descripción
                </h2>
              </div>

              <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </section>
          )}

          {hasSpecs && (
            <section
              className={`${
                hasDescription ? 'lg:col-span-6' : ''
              } bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs`}
            >
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
                  Especificaciones Técnicas
                </h2>
              </div>

              <div className="rounded-xl border border-gray-200/90 overflow-hidden">
                <dl className="divide-y divide-gray-200/80">
                  {technicalSpecs.map((spec, idx) => (
                    <div
                      key={`${spec.key}-${idx}`}
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4 px-4 py-3 text-xs sm:text-sm ${
                        idx % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-white'
                      }`}
                    >
                      <dt className="font-bold text-gray-900">{spec.key}</dt>
                      <dd className="text-gray-700 sm:text-right font-medium wrap-break-word">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}