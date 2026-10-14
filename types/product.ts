export interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: string;
  physical_stock: number;
  is_combo: boolean;
}

export interface CatalogResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}