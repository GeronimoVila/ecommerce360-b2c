export interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: string | number;
  physical_stock: number;
  is_combo: boolean;
  category_id?: string | null;
  dynamic_pricing?: DynamicPricing;
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

export interface CreditCardPlan {
  gateway: string;
  installments: number;
  installment_amount: number;
  final_total: number;
  interest_percentage: number;
}

export interface CashTransferPlan {
  discount_percentage: number;
  final_total: number;
  label: string;
}

export interface DynamicPricing {
  cash_transfer?: CashTransferPlan;
  credit_card: CreditCardPlan[];
}