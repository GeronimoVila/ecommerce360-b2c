import { CategoryNode } from '@/src/types/category';

const CORE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function filterCategoriesWithProducts(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .filter((node) => node.is_active !== false)
    .map((node) => ({
      ...node,
      children: node.children ? filterCategoriesWithProducts(node.children) : [],
    }))
    .filter((node) => (node.products_count ?? 0) > 0 || node.children.length > 0);
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    const res = await fetch(`${CORE_API_URL}/api/v1/categories/tree`, {
      next: {
        revalidate: 300,
        tags: ['categories'],
      },
    });

    if (!res.ok) return [];
    const json = await res.json();
    const rawTree: CategoryNode[] = json.data || [];
    return filterCategoriesWithProducts(rawTree);
  } catch (error) {
    console.error('[B2C] Error obteniendo árbol de categorías:', error);
    return [];
  }
}

export function getCategoryBreadcrumbs(
  nodes: CategoryNode[],
  targetSlugOrId: string
): CategoryNode[] {
  for (const node of nodes) {
    if (node.slug === targetSlugOrId || node.id === targetSlugOrId) {
      return [node];
    }
    if (node.children && node.children.length > 0) {
      const subPath = getCategoryBreadcrumbs(node.children, targetSlugOrId);
      if (subPath.length > 0) {
        return [node, ...subPath];
      }
    }
  }
  return [];
}