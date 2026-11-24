import { coreFetch } from '../lib/apiClient';

const CORE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type CustomerNotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'PAYMENT_ACTION_REQUIRED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'SHIPPING_ISSUE'
  | 'ASSISTED_BUDGET_READY'
  | string;

export interface CustomerNotification {
  id: string;
  user_id: string;
  role: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: CustomerNotification[];
  unread_count: number;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function resolveNotificationHref(notification: CustomerNotification): string | null {
  const rawUrl = notification.action_url;
  const orderId = notification.metadata?.order_id;

  if (rawUrl) {
    if (rawUrl.startsWith('/budget/')) {
      const budgetId = rawUrl.replace('/budget/', '');
      return `/checkout/budget/${budgetId}`;
    }

    if (rawUrl.startsWith('/orders/')) {
      const targetOrderId = rawUrl.replace('/orders/', '');
      return `/mis-compras?orderId=${encodeURIComponent(targetOrderId)}`;
    }

    return rawUrl;
  }

  if (orderId) {
    if (notification.type === 'ASSISTED_BUDGET_READY') {
      return `/checkout/budget/${orderId}`;
    }
    return `/mis-compras?orderId=${encodeURIComponent(orderId)}`;
  }

  return '/mis-compras';
}

export const notificationsService = {
  async getNotifications(page = 1, limit = 15): Promise<NotificationsListResponse> {
    return coreFetch<NotificationsListResponse>(
      `/api/v1/notifications?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  },

  async getUnreadCount(): Promise<number> {
    const res = await coreFetch<{ unread_count: number }>(
      '/api/v1/notifications/unread-count',
      { method: 'GET' }
    );
    return res.unread_count ?? 0;
  },

  async markAsRead(id: string): Promise<void> {
    await coreFetch(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<void> {
    await coreFetch('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
  },

  subscribeToStream(onNotification: (notif: CustomerNotification) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const eventSource = new EventSource(`${CORE_API_URL}/api/v1/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as CustomerNotification;
        onNotification(parsed);
      } catch (err) {
        console.error('[SSE Notification Parse Error]:', err);
      }
    });

    eventSource.onerror = () => {
    };

    return () => {
      eventSource.close();
    };
  },
};