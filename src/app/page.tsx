import { Suspense } from 'react';
import Link from 'next/link';
import ProductCard from '@/src/components/catalog/ProductCard';
import { CatalogResponse } from '@/src/types/product';
import { getCategoryTree, getCategoryBreadcrumbs } from '@/src/services/category.service';

interface HomeProps {
  searchParams: Promise<{ category?: string }>;
}

async function getCatalog(categorySlug?: string): Promise<CatalogResponse> {
  const params = new URLSearchParams({ limit: '20' });
  if (categorySlug) {
    params.append('category_slug', categorySlug);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/storefront?${params.toString()}`,
    {
      next: {
        revalidate: 60,
        tags: ['products'],
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error al cargar el catálogo de la tienda');
  }
  return res.json();
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-80 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="w-full h-40 bg-gray-200 rounded-md" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-6 w-1/2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function CatalogContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ category?: string }> }) {
  const { category: categorySlug } = await searchParamsPromise;

  const [response, categoryTree] = await Promise.all([
    getCatalog(categorySlug),
    getCategoryTree(),
  ]);

  const products = response.data || [];
  const breadcrumbs = categorySlug ? getCategoryBreadcrumbs(categoryTree, categorySlug) : [];
  const activeCategory = breadcrumbs[breadcrumbs.length - 1] || null;
  const subCategories = activeCategory ? activeCategory.children : categoryTree;

  return (
    <>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">
            Inicio
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id} className="flex items-center space-x-2">
              <span>/</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-gray-900">{crumb.name}</span>
              ) : (
                <Link href={`/?category=${crumb.slug}`} className="hover:text-blue-600">
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {activeCategory ? activeCategory.name : 'Nuestros Productos'}
        </h1>
        {activeCategory && (
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Ver todo el catálogo
          </Link>
        )}
      </div>

      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/?category=${sub.slug}`}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">
            No hay productos disponibles en esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}