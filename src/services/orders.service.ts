import { coreFetch } from '../lib/apiClient';

export type OrderStatus = 'PENDING' | 'BUDGET' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export interface CustomerOrderItem {
  id: string;
  product_id: string | null;
  sku: string;
  name: string;
  is_combo: boolean;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_method: string | null;
  shipping_cp: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  advisor: {
    name: string;
    ref_code: string;
  } | null;
  items: CustomerOrderItem[];
}

export interface PaginatedOrdersResponse {
  success: boolean;
  data: CustomerOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const ordersService = {
  async getMyOrders(params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus | 'ALL';
  }): Promise<PaginatedOrdersResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status && params?.status !== 'ALL') {
      query.set('status', params.status);
    }

    const qs = query.toString();
    const endpoint = `/api/v1/orders/my-orders${qs ? `?${qs}` : ''}`;

    return coreFetch<PaginatedOrdersResponse>(endpoint, {
      method: 'GET',
    });
  },

  async getMyOrderDetail(orderId: string): Promise<{ success: boolean; data: CustomerOrder }> {
    return coreFetch<{ success: boolean; data: CustomerOrder }>(
      `/api/v1/orders/my-orders/${orderId}`,
      { method: 'GET' }
    );
  },
};