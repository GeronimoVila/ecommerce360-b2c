'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronRight,
  ChevronDown,
  Tv,
  Refrigerator,
  Wind,
  UtensilsCrossed,
  Laptop,
  Flame,
  Tag,
  LayoutGrid,
  Sparkles,
  Package,
  User,
  LogOut,
  Layers,
} from 'lucide-react';
import { CategoryNode } from '@/src/types/category';
import { filterCategoriesWithProducts } from '@/src/services/category.service';

interface CategorySidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  activeCategorySlug: string;
  isOffersActive: boolean;
  isCombosActive: boolean;
  isAuthenticated?: boolean;
  userFirstName?: string;
  onLogout?: () => void;
}

function getCategoryIcon(slug: string, name: string) {
  const key = `${slug} ${name}`.toLowerCase();
  if (key.includes('tv') || key.includes('audio') || key.includes('video')) {
    return <Tv className="w-4 h-4 shrink-0" />;
  }
  if (key.includes('refrig') || key.includes('lavado') || key.includes('heladera')) {
    return <Refrigerator className="w-4 h-4 shrink-0" />;
  }
  if (key.includes('clima') || key.includes('aire') || key.includes('calefac')) {
    return <Wind className="w-4 h-4 shrink-0" />;
  }
  if (key.includes('cocina') || key.includes('horno') || key.includes('hogar')) {
    return <UtensilsCrossed className="w-4 h-4 shrink-0" />;
  }
  if (
    key.includes('inform') ||
    key.includes('comput') ||
    key.includes('notebook') ||
    key.includes('tech')
  ) {
    return <Laptop className="w-4 h-4 shrink-0" />;
  }
  return <Tag className="w-4 h-4 shrink-0" />;
}

function collectAncestorIds(nodes: CategoryNode[], targetSlug: string): string[] {
  if (!targetSlug) return [];
  for (const node of nodes) {
    if (node.slug === targetSlug) {
      return [node.id];
    }
    if (node.children && node.children.length > 0) {
      const childPath = collectAncestorIds(node.children, targetSlug);
      if (childPath.length > 0) {
        return [node.id, ...childPath];
      }
    }
  }
  return [];
}

interface CascadeItemProps {
  node: CategoryNode;
  level: number;
  activeCategorySlug: string;
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onClose: () => void;
}

function CascadeCategoryItem({
  node,
  level,
  activeCategorySlug,
  expandedIds,
  onToggleExpand,
  onClose,
}: CascadeItemProps) {
  const activeChildren = node.children || [];
  const hasChildren = activeChildren.length > 0;
  const isExpanded = Boolean(expandedIds[node.id]);
  const isActive = activeCategorySlug === node.slug;

  const paddingLeftPx = 12 + level * 14;

  return (
    <div className="select-none">
      <div
        style={{ paddingLeft: `${paddingLeftPx}px` }}
        className={`group flex items-center justify-between gap-1.5 pr-2.5 py-2.5 rounded-xl transition-colors ${
          isActive
            ? 'bg-blue-50 text-[#0056D2] font-bold'
            : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-950 font-medium'
        }`}
      >
        <Link
          href={`/?category=${encodeURIComponent(node.slug)}`}
          onClick={onClose}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-xs sm:text-sm"
        >
          {level === 0 ? (
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0056D2] text-white'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-[#0056D2]'
              }`}
            >
              {getCategoryIcon(node.slug, node.name)}
            </span>
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isActive ? 'bg-[#0056D2]' : 'bg-gray-300 group-hover:bg-gray-500'
              }`}
            />
          )}

          <span className="truncate">{node.name}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            aria-label={
              isExpanded ? `Contraer ${node.name}` : `Desplegar subcategorías de ${node.name}`
            }
            aria-expanded={isExpanded}
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isExpanded
                ? 'bg-blue-100/70 text-[#0056D2]'
                : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200/70'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 mb-1.5 ml-3 border-l-2 border-gray-100 pl-1 space-y-0.5">
          {activeChildren.map((child) => (
            <CascadeCategoryItem
              key={child.id}
              node={child}
              level={level + 1}
              activeCategorySlug={activeCategorySlug}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategorySidebarDrawer({
  isOpen,
  onClose,
  categories,
  activeCategorySlug,
  isOffersActive,
  isCombosActive,
  isAuthenticated = false,
  userFirstName,
  onLogout,
}: CategorySidebarDrawerProps) {
  const visibleRootCategories = useMemo(
    () => filterCategoriesWithProducts(categories),
    [categories]
  );

  const activeAncestorIds = useMemo(
    () => collectAncestorIds(visibleRootCategories, activeCategorySlug),
    [visibleRootCategories, activeCategorySlug]
  );

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || activeAncestorIds.length === 0) return;
    setExpandedIds((prev) => {
      const next = { ...prev };
      for (const id of activeAncestorIds) {
        next[id] = true;
      }
      return next;
    });
  }, [isOpen, activeAncestorIds]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <aside
        aria-label="Menú de categorías"
        className="w-[86vw] max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col border-r border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#0056D2] flex items-center justify-center text-white font-black text-sm shadow-xs">
              <span className="w-2.5 h-3.5 bg-white rounded-xs block" />
            </span>
            <span className="text-lg font-black tracking-tight text-gray-950">
              LEGADO<span className="text-[#db1f1f]">HOGAR</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-5">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
              Explorar Tienda
            </p>

            <Link
              href="/"
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                !activeCategorySlug && !isOffersActive && !isCombosActive
                  ? 'bg-gray-950 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Todo el Catálogo</span>
            </Link>

            <Link
              href="/?offers=true"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                isOffersActive
                  ? 'bg-orange-50 text-[#EA580C] border border-orange-200/80'
                  : 'text-[#EA580C] hover:bg-orange-50/70'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 shrink-0" />
                <span>Ofertas Destacadas</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-[#EA580C] text-white px-1.5 py-0.5 rounded">
                Hot
              </span>
            </Link>

            <Link
              href="/?combos=true"
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                isCombosActive
                  ? 'bg-orange-50 text-[#EA580C] border border-orange-200/80'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4 text-[#EA580C] shrink-0" />
              <span>Combos Ahorro</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Categorías y Subcategorías
              </p>
              <Sparkles className="w-3.5 h-3.5 text-[#0056D2]" />
            </div>

            {visibleRootCategories.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-400">
                No hay categorías disponibles en este momento.
              </p>
            ) : (
              <nav aria-label="Árbol de categorías" className="space-y-1">
                {visibleRootCategories.map((rootCat) => (
                  <CascadeCategoryItem
                    key={rootCat.id}
                    node={rootCat}
                    level={0}
                    activeCategorySlug={activeCategorySlug}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onClose={onClose}
                  />
                ))}
              </nav>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-[#F8FAFC] space-y-2">
          {isAuthenticated ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/mis-compras"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:border-[#0056D2] transition-colors"
                >
                  <Package className="w-3.5 h-3.5 text-[#0056D2]" />
                  <span>Mis Compras</span>
                </Link>
                <Link
                  href="/mi-cuenta"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:border-[#0056D2] transition-colors truncate"
                >
                  <User className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
                  <span className="truncate">{userFirstName || 'Mi Perfil'}</span>
                </Link>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0056D2] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </Link>
              <Link
                href="/checkout/register"
                onClick={onClose}
                className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}