import { coreFetch } from '../lib/apiClient';

interface CheckoutPayload {
  customerId?: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: 'MP' | 'MOBBEX' | 'TRANSFERENCIA';
}

export const createCheckoutIntent = async (payload: CheckoutPayload) => {
  return coreFetch('/api/v1/checkout/intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};