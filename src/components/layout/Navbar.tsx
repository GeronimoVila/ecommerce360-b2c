"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  User,
  Search,
  ShoppingBag,
  Truck,
  ChevronDown,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { useCartStore } from '@/src/store/cartStore';
import { CategoryNode } from '@/src/types/category';
import NotificationBell from './NotificationBell';
import CategorySidebarDrawer from './CategorySidebarDrawer';
import { filterCategoriesWithProducts } from '@/src/services/category.service';

interface NavbarProps {
  categories?: CategoryNode[];
}

function flattenCategoriesForSelect(
  nodes: CategoryNode[],
  depth = 0
): { id: string; slug: string; label: string }[] {
  const result: { id: string; slug: string; label: string }[] = [];
  for (const node of nodes) {
    if (node.is_active === false) continue;
    const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
    result.push({
      id: node.id,
      slug: node.slug,
      label: `${prefix}${node.name}`,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoriesForSelect(node.children, depth + 1));
    }
  }
  return result;
}

export default function Navbar({ categories = [] }: NavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, user, isChecking, checkSession, logout } = useAuthStore();
  const cartItemsCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const openDrawer = useCartStore((state) => state.openDrawer);

  const activeCategorySlug = searchParams.get('category') || '';
  const isOffersActive = searchParams.get('offers') === 'true';
  const isCombosActive = searchParams.get('combos') === 'true';

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(activeCategorySlug);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const flatSelectCategories = useMemo(
    () => flattenCategoriesForSelect(filterCategoriesWithProducts(categories)),
    [categories]
  );

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="bg-[#00A859] text-white text-[11px] sm:text-xs py-2 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-medium leading-tight">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                <strong className="font-bold">Envío Gratis a Gran San Juan</strong> en Smart TVs y Línea Blanca
              </span>
              <span className="hidden md:inline text-white/60 mx-1">|</span>
              <span className="hidden md:inline text-white/95">
                Despacho garantizado en 24hs hábiles
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-5 py-3.5 sm:py-5">
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 min-w-0">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(true)}
                aria-label="Abrir menú de categorías"
                aria-expanded={isCategoryMenuOpen}
                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                  activeCategorySlug
                    ? 'bg-blue-50 border-[#0056D2]/40 text-[#0056D2]'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                }`}
              >
                <Menu className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Categorías</span>
              </button>

              <Link href="/" className="flex items-center shrink-0 group min-w-0">
                <Image
                  src="/images/Logo 3D Legado Hogar.png"
                  alt="Legado Hogar"
                  width={320}
                  height={110}
                  priority
                  className="h-16 sm:h-20 lg:h-24 w-auto object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </Link>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-2xl items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#0056D2] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all"
            >
              <div className="relative flex items-center border-r border-gray-200 bg-transparent max-w-45">
                <select
                  aria-label="Filtrar por categoría"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-transparent pl-3.5 pr-7 py-3 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer truncate w-full"
                >
                  <option value="">Todas</option>
                  {flatSelectCategories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none absolute right-2.5" />
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar Smart TVs, heladeras, audio, lavarropas..."
                className="flex-1 bg-transparent px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />

              <button
                type="submit"
                aria-label="Buscar"
                className="px-4 py-3 text-gray-500 hover:text-[#0056D2] transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
              {!isChecking && (
                <>
                  {isAuthenticated ? (
                    <div className="flex items-center gap-1 sm:gap-3.5">
                      <Link
                        href="/mis-compras"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-[#0056D2] p-1.5 sm:p-0 transition-colors"
                        title="Mis Compras"
                      >
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="hidden lg:inline">Mis Compras</span>
                      </Link>

                      <NotificationBell />

                      <Link
                        href="/mi-cuenta"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-[#0056D2] p-1.5 sm:p-0 transition-colors"
                        title={user?.email || 'Mi Perfil'}
                      >
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="hidden sm:inline">
                          {user?.customer_profile?.first_name || 'Mi Perfil'}
                        </span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden xl:inline">Salir</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-[#0056D2] px-1.5 sm:px-2 py-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="hidden xs:inline sm:inline">Ingresar</span>
                      </Link>
                      <Link
                        href="/checkout/register"
                        className="hidden sm:inline-flex text-xs font-semibold text-[#0056D2] bg-blue-50 hover:bg-blue-100 px-3.5 py-2.5 rounded-lg transition-colors"
                      >
                        Registrarse
                      </Link>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={openDrawer}
                aria-label={`Carrito (${cartItemsCount})`}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Carrito</span>
                <span className="inline-flex items-center justify-center bg-white/15 sm:bg-transparent px-1.5 sm:px-0 py-0.5 sm:py-0 rounded-md text-[11px] sm:text-sm font-bold">
                  <span className="sm:hidden">{cartItemsCount}</span>
                  <span className="hidden sm:inline">({cartItemsCount})</span>
                </span>
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex md:hidden items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-3 focus-within:border-[#0056D2] focus-within:bg-white"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="px-3.5 py-2.5 text-gray-500 hover:text-[#0056D2]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <CategorySidebarDrawer
        isOpen={isCategoryMenuOpen}
        onClose={() => setIsCategoryMenuOpen(false)}
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        isOffersActive={isOffersActive}
        isCombosActive={isCombosActive}
        isAuthenticated={isAuthenticated}
        userFirstName={user?.customer_profile?.first_name}
        onLogout={handleLogout}
      />
    </>
  );
}