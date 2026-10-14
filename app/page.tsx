import ProductCard from '@/components/catalog/ProductCard';
import { CatalogResponse } from '@/types/product';

async function getCatalog(): Promise<CatalogResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?limit=20`, {
    next: { revalidate: 60 }
  });
  
  if (!res.ok) throw new Error('Error al cargar el catálogo');
  return res.json();
}

export default async function Home() {
  const { data: products } = await getCatalog();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Catálogo de Productos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}