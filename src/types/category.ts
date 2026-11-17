export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path: string;
  depth: number;
  is_active: boolean;
  products_count: number;
  is_leaf: boolean;
  children: CategoryNode[];
}