import { Suspense } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import ProductCard from '@/src/components/catalog/ProductCard';
import PromoCarousel, { StorefrontBannerItem } from '@/src/components/catalog/PromoCarousel';
import { CatalogResponse, Product } from '@/src/types/product';
import { getCategoryTree, getCategoryBreadcrumbs } from '@/src/services/category.service';

interface HomeSearchParams {
  category?: string;
  search?: string;
  offers?: string;
  combos?: string;
}

interface HomeProps {
  searchParams: Promise<HomeSearchParams>;
}

async function getStorefrontHome(): Promise<{
  banners: StorefrontBannerItem[];
  featured_products: Product[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/storefront/home`, {
    next: { revalidate: 60, tags: ['products'] },
  });
  if (!res.ok) {
    return { banners: [], featured_products: [] };
  }
  return res.json();
}

async function getFilteredCatalog(filters: HomeSearchParams): Promise<CatalogResponse> {
  const params = new URLSearchParams({ limit: '24' });
  if (filters.category) params.append('category_slug', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.combos === 'true') params.append('is_combo', 'true');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/storefront?${params.toString()}`,
    {
      next: { revalidate: 60, tags: ['products'] },
    }
  );

  if (!res.ok) {
    throw new Error('Error al cargar el catálogo de la tienda');
  }
  return res.json();
}

function CatalogSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-80 bg-white border border-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-96 bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="w-full h-44 bg-gray-100 rounded-xl" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-6 w-1/2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function CatalogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<HomeSearchParams>;
}) {
  const filters = await searchParamsPromise;
  const hasActiveFilters = Boolean(
    filters.category || filters.search || filters.offers === 'true' || filters.combos === 'true'
  );

  const [homeData, categoryTree, catalogResponse] = await Promise.all([
    getStorefrontHome(),
    getCategoryTree(),
    hasActiveFilters ? getFilteredCatalog(filters) : Promise.resolve(null),
  ]);

  let products: Product[] = hasActiveFilters
    ? catalogResponse?.data || []
    : homeData.featured_products || [];

  if (filters.offers === 'true') {
    const discounted = products.filter((p) => Boolean(p.dynamic_pricing?.cash_transfer));
    if (discounted.length > 0) products = discounted;
  }

  const breadcrumbs = filters.category
    ? getCategoryBreadcrumbs(categoryTree, filters.category)
    : [];
  const activeCategory = breadcrumbs[breadcrumbs.length - 1] || null;

  const sectionTitle = filters.search
    ? `Resultados para "${filters.search}"`
    : activeCategory
    ? activeCategory.name
    : filters.combos === 'true'
    ? 'Combos Ahorro'
    : 'Ofertas Destacadas de la Semana';

  return (
    <>
      {!hasActiveFilters && <PromoCarousel banners={homeData.banners} />}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0056D2]">
            Inicio
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id} className="flex items-center space-x-2">
              <span>/</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-gray-900">{crumb.name}</span>
              ) : (
                <Link href={`/?category=${crumb.slug}`} className="hover:text-[#0056D2]">
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">
            {sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Precios preferenciales para compras de contado y transferencias bancarias.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              !hasActiveFilters
                ? 'bg-gray-950 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
            }`}
          >
            Todos
          </Link>

          <Link
            href="/?combos=true"
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filters.combos === 'true'
                ? 'bg-[#EA580C] text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-[#EA580C]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            Combos Ahorro
          </Link>

          {(activeCategory?.children && activeCategory.children.length > 0
            ? activeCategory.children
            : categoryTree.slice(0, 4)
          ).map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/?category=${cat.slug}`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#0056D2] text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0056D2]'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-600 font-semibold">
            No encontramos productos con los filtros seleccionados.
          </p>
          <Link
            href="/"
            className="inline-block mt-3 text-xs font-bold text-[#0056D2] hover:underline"
          >
            Volver a ver todas las ofertas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <section className="mt-14 bg-[#070B14] rounded-2xl px-6 sm:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            ¿Buscás atención personalizada o compras corporativas?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Comunicate con nuestro equipo de asesores en San Juan para presupuestos a medida y cotizaciones inmediatas.
          </p>
        </div>

        <a
          href="https://wa.me/5492640000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#00A859] hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-sm transition-colors shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Consultar por WhatsApp</span>
        </a>
      </section>
    </>
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}