import ProductCard from '@/src/components/catalog/ProductCard';
import { CatalogResponse } from '@/src/types/product';

async function getCatalog(): Promise<CatalogResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/storefront?limit=20`, {
    next: { 
      revalidate: 60,
      tags: ['products']
    }
  });
  
  if (!res.ok) {
    throw new Error('Error al cargar el catálogo de la tienda');
  }
  return res.json();
}

export default async function Home() {
  const response = await getCatalog();
  const products = response.data || [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Nuestros Productos
      </h1>
      
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">Actualmente no hay productos disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}