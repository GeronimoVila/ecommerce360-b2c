"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  UserCheck,
  Tag,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import {
  ordersService,
  type CustomerOrder,
  type OrderStatus,
} from '@/src/services/orders.service';

type FilterTab = 'ALL' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes de pago' },
  { key: 'PAID', label: 'Pagadas' },
  { key: 'SHIPPED', label: 'En camino' },
  { key: 'DELIVERED', label: 'Entregadas' },
];

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    stepIndex: number;
    Icon: typeof Clock;
  }
> = {
  PENDING: {
    label: 'Pendiente de pago',
    description: 'Esperando confirmación de la pasarela de pago.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    stepIndex: 0,
    Icon: Clock,
  },
  BUDGET: {
    label: 'Presupuesto',
    description: 'Cotización comercial generada.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    stepIndex: 0,
    Icon: Clock,
  },
  PAID: {
    label: 'Pago acreditado',
    description: 'Estamos preparando tu pedido en depósito.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    stepIndex: 1,
    Icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'En camino',
    description: 'Tu pedido fue despachado y está en tránsito.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    stepIndex: 2,
    Icon: Truck,
  },
  DELIVERED: {
    label: 'Entregado',
    description: 'Pedido recibido correctamente.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepIndex: 3,
    Icon: PackageCheck,
  },
};

const TRACKING_STEPS = [
  { label: 'Pedido creado', Icon: Clock },
  { label: 'Pago confirmado', Icon: CheckCircle2 },
  { label: 'Despachado', Icon: Truck },
  { label: 'Entregado', Icon: PackageCheck },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));

const formatPaymentMethod = (method: string | null) => {
  if (!method) return 'No especificado';
  if (method === 'MP') return 'Mercado Pago';
  if (method === 'MOBBEX') return 'Mobbex';
  return method;
};

export default function MisComprasPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useAuthStore();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isChecking, isAuthenticated, router]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const response = await ordersService.getMyOrders({
        page,
        limit: 8,
        status: activeTab,
      });

      setOrders(response.data);
      setTotalPages(response.meta.totalPages || 1);
      setTotalOrders(response.meta.total);

      // Expandir automáticamente la compra más reciente en la primera página
      if (page === 1 && response.data.length > 0) {
        setExpandedOrderIds((prev) => ({
          ...prev,
          [response.data[0].id]: true,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus compras.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Mis Compras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta el estado de envío y el comprobante de todos tus pedidos ({totalOrders}).
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          Seguir comprando
        </Link>
      </div>

      {/* Tabs de filtro por estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Estados de carga y error */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-6 w-28 bg-gray-200 rounded-full" />
              </div>
              <div className="h-16 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {activeTab === 'ALL'
              ? 'Todavía no realizaste ninguna compra'
              : 'No tienes pedidos en este estado'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {activeTab === 'ALL'
              ? 'Explora nuestro catálogo y realiza tu primera compra con seguimiento en tiempo real.'
              : 'Prueba seleccionando otra pestaña de filtro para ver tus demás pedidos.'}
          </p>
          {activeTab === 'ALL' ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Explorar catálogo
            </Link>
          ) : (
            <button
              onClick={() => handleTabChange('ALL')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver todas mis compras
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const statusMeta = STATUS_META[order.status] || STATUS_META.PENDING;
            const StatusIcon = statusMeta.Icon;
            const isExpanded = Boolean(expandedOrderIds[order.id]);

            return (
              <article
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Cabecera del Pedido */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                        Pedido #{order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Realizado el {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="block text-xs text-gray-400">Total abonado</span>
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Ocultar <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Detalle <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Barra de Seguimiento Logístico */}
                <div className="px-5 sm:px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-3">
                    {statusMeta.description}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {TRACKING_STEPS.map((step, idx) => {
                      const isCompleted = idx <= statusMeta.stepIndex;
                      const StepIcon = step.Icon;
                      return (
                        <div key={step.label} className="flex flex-col">
                          <div
                            className={`h-1.5 rounded-full mb-2 transition-colors ${
                              isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          />
                          <div className="flex items-center gap-1.5">
                            <StepIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isCompleted ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-medium truncate ${
                                isCompleted ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detalle Expandible de Ítems y Metadatos */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              {item.product_id ? (
                                <Link
                                  href={`/productos/${item.product_id}`}
                                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                <p className="text-sm font-semibold text-gray-700 line-clamp-1">
                                  {item.name}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span>Cantidad: {item.quantity}</span>
                                <span>•</span>
                                <span>{formatCurrency(item.unit_price)} c/u</span>
                                {item.is_combo && (
                                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-semibold">
                                    Combo
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pie con información de pago, envío y asesor */}
                    <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-800 block">Medio de pago</span>
                          <span>{formatPaymentMethod(order.payment_method)}</span>
                          {order.coupon_code && (
                            <span className="mt-1 inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Tag className="w-3 h-3" /> Cupón {order.coupon_code} (-
                              {formatCurrency(order.discount_amount)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-800 block">Entrega</span>
                          <span>
                            {order.shipping_address
                              ? `${order.shipping_address}${
                                  order.shipping_cp ? ` (CP ${order.shipping_cp})` : ''
                                }`
                              : order.shipping_cp
                              ? `Código Postal ${order.shipping_cp}`
                              : 'A coordinar con despacho'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-gray-800 block">Asesor comercial</span>
                          <span>
                            {order.advisor ? order.advisor.name : 'Compra directa online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <div className="flex justify-end">
                        <Link
                          href={`/checkout/result?order_id=${order.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          Verificar estado de acreditación del pago →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-gray-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}