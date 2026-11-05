import { coreFetch } from '../lib/apiClient';

export interface CheckoutIntentItem {
  productId: string;
  quantity: number;
}

export interface CheckoutIntentPayload {
  items: CheckoutIntentItem[]; 
  paymentMethod: 'MP' | 'MOBBEX';
}

export interface CheckoutIntentResponse {
  success: boolean;
  message: string;
  attribution?: {
    status: string;
    sellerId: string | null;
  };
  order?: {
    id: string;
    total_amount: number | string;
    status: string;
    itemsCount: number;
  };
  checkoutUrl?: string;
  error?: string;
}

export async function createCheckoutIntent(payload: CheckoutIntentPayload): Promise<CheckoutIntentResponse> {
  return await coreFetch<CheckoutIntentResponse>('/api/v1/checkout/intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}