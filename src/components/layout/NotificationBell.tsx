"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Truck,
  PackageCheck,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  notificationsService,
  resolveNotificationHref,
  type CustomerNotification,
  type CustomerNotificationType,
} from '@/src/services/notifications.service';

function formatRelativeTime(isoDate: string): string {
  const diffSeconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diffSeconds < 60) return 'Hace un momento';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(isoDate));
}

function getNotificationVisuals(type: CustomerNotificationType) {
  switch (type) {
    case 'ORDER_CREATED':
      return {
        Icon: ShoppingBag,
        bgClass: 'bg-blue-50 text-[#0056D2]',
      };
    case 'ORDER_PAID':
      return {
        Icon: CheckCircle2,
        bgClass: 'bg-emerald-50 text-[#00A859]',
      };
    case 'PAYMENT_ACTION_REQUIRED':
      return {
        Icon: AlertTriangle,
        bgClass: 'bg-amber-50 text-amber-600',
      };
    case 'ORDER_OUT_FOR_DELIVERY':
      return {
        Icon: Truck,
        bgClass: 'bg-indigo-50 text-indigo-600',
      };
    case 'ORDER_DELIVERED':
      return {
        Icon: PackageCheck,
        bgClass: 'bg-emerald-50 text-[#00A859]',
      };
    case 'ORDER_CANCELLED':
    case 'SHIPPING_ISSUE':
      return {
        Icon: XCircle,
        bgClass: 'bg-red-50 text-red-600',
      };
    case 'ASSISTED_BUDGET_READY':
      return {
        Icon: FileText,
        bgClass: 'bg-orange-50 text-[#EA580C]',
      };
    default:
      return {
        Icon: Bell,
        bgClass: 'bg-gray-100 text-gray-600',
      };
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationsService.getNotifications(1, 15);
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('[NotificationBell] Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    const unsubscribe = notificationsService.subscribeToStream((incoming) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 20);
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchInitialData();
    }
  };

  const handleNotificationClick = async (notif: CustomerNotification) => {
    if (!notif.read_at) {
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, read_at: nowIso } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      notificationsService.markAsRead(notif.id).catch(() => {
        fetchInitialData();
      });
    }

    setIsOpen(false);

    const targetHref = resolveNotificationHref(notif);
    if (targetHref) {
      router.push(targetHref);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || nowIso })));
    setUnreadCount(0);

    try {
      await notificationsService.markAllAsRead();
    } catch {
      await fetchInitialData();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Notificaciones"
        aria-expanded={isOpen}
        className="relative p-2 text-gray-600 hover:text-[#0056D2] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-extrabold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/90 z-50 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2 bg-[#F8FAFC]">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-extrabold text-gray-950 truncate">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0056D2] border border-blue-200/80 shrink-0">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0056D2] hover:text-blue-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar todas</span>
              </button>
            )}
          </div>

          <div className="max-h-[calc(100dvh-8.5rem)] sm:max-h-105 overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#0056D2] mb-2" />
                <span className="text-xs font-medium">Cargando notificaciones...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">No tenés notificaciones</p>
                <p className="text-xs text-gray-500 mt-1">
                  Te avisaremos acá sobre el estado de tus pedidos y cotizaciones.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read_at;
                const { Icon, bgClass } = getNotificationVisuals(notif.type);

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-gray-50 cursor-pointer ${
                      isUnread ? 'bg-blue-50/35' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${bgClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-snug ${
                            isUnread ? 'font-extrabold text-gray-950' : 'font-semibold text-gray-700'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#0056D2] shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <span className="block text-[11px] font-medium text-gray-400 mt-1.5">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}