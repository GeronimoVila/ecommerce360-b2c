import { Product } from '@/src/types/product';
import PaymentSimulator from '@/src/components/catalog/PaymentSimulator';
import AddToCartButton from '@/src/components/catalog/AddToCartButton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function getProductDetail(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/storefront/${id}`, {
      next: { revalidate: 60, tags: [`product-${id}`] }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

function ProductSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-lg font-medium text-gray-500 animate-pulse">
        Cargando detalle del producto...
      </div>
    </div>
  );
}

async function ProductDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = await paramsPromise;
  const product = await getProductDetail(resolvedParams.id);

  if (!product) {
    notFound(); 
  }

  const basePrice = Number(product.base_price);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
      <div className="flex flex-col items-center justify-center w-full bg-gray-100 rounded-lg aspect-square">
        <span className="text-xl font-medium text-gray-400">Sin Imagen Disponible</span>
      </div>

      <div className="mt-10 px-4 sm:px-0 lg:mt-0">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
        </div>

        <div className="mt-3">
          <p className="text-3xl text-gray-900">${basePrice.toLocaleString('es-AR')}</p>
        </div>

        <PaymentSimulator 
          pricing={product.dynamic_pricing} 
          basePrice={basePrice} 
        />

        <div className="mt-6">
          <div className="flex items-center">
            {product.physical_stock > 0 ? (
              <span className="text-sm font-medium text-green-600">
                ✓ {product.physical_stock > 5 ? 'Stock disponible' : `¡Últimas ${product.physical_stock} unidades!`}
              </span>
            ) : (
              <span className="text-sm font-medium text-red-600">
                ✗ Agotado temporalmente
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <div className="flex-1">
            <AddToCartButton 
              productId={product.id} 
              quantity={1} 
              maxStock={product.physical_stock} 
              disabled={product.physical_stock <= 0}
            />
          </div>
        </div>

        {product.is_combo && product.combo_parts && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-medium text-gray-900">Este combo incluye:</h3>
            <ul className="mt-4 space-y-2">
              {product.combo_parts.map((part: any, index: number) => (
                <li key={index} className="text-sm text-gray-500 flex items-center">
                  <span className="mr-2 text-purple-600">•</span>
                  {part.quantity}x {part.product.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetailContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}