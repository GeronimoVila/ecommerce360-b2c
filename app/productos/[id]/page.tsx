import { Suspense } from 'react';
import PaymentSimulator from '@/components/catalog/PaymentSimulator';
import { Product } from '@/types/product';

async function ProductContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = await paramsPromise;
  const productId = resolvedParams.id;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}`, {
    next: { revalidate: 60 }
  });
  
  if (!res.ok) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-gray-500">Producto no encontrado</h2>
      </div>
    );
  }
  
  const product: Product = await res.json();
  const basePrice = Number(product.base_price);
  const bestPrice = product.dynamic_pricing?.cash_transfer?.final_total || basePrice;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="flex items-center justify-center bg-gray-100 rounded-xl min-h-100">
        <span className="text-gray-400">Galería de Imágenes</span>
      </div>

      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
        
        <div className="mt-6">
          <p className="text-4xl font-extrabold text-gray-900">
            ${bestPrice.toLocaleString('es-AR')}
          </p>
        </div>

        <PaymentSimulator pricing={product.dynamic_pricing} basePrice={basePrice} />
        
        <button className="w-full py-4 mt-8 font-bold text-white transition-colors bg-black rounded-lg hover:bg-gray-800">
          Agregar al Carrito
        </button>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="container max-w-5xl px-4 py-8 mx-auto md:py-12">
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-100 animate-pulse space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-gray-500">Cargando producto y opciones de pago...</p>
          </div>
        }
      >
        <ProductContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}