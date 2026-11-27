"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  UserCheck,
  Tag,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import {
  ordersService,
  type CustomerOrder,
  type OrderStatus,
} from '@/src/services/orders.service';

type FilterTab = 'ALL' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes de pago' },
  { key: 'PAID', label: 'Pagadas' },
  { key: 'SHIPPED', label: 'En camino' },
  { key: 'DELIVERED', label: 'Entregadas' },
  { key: 'CANCELED', label: 'Canceladas' },
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
    description: 'Esperando confirmación de acreditación para iniciar el despacho.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
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
    description: 'Estamos preparando tu pedido en nuestro centro de distribución.',
    badgeClass: 'bg-blue-50 text-[#0056D2] border-blue-200/90',
    stepIndex: 1,
    Icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'En camino',
    description: 'Tu pedido fue despachado y está en tránsito hacia tu domicilio.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
    stepIndex: 2,
    Icon: Truck,
  },
  DELIVERED: {
    label: 'Entregado',
    description: 'Pedido recibido correctamente. ¡Gracias por elegir LEGADO HOGAR!',
    badgeClass: 'bg-emerald-50 text-[#00A859] border-emerald-200/90',
    stepIndex: 3,
    Icon: PackageCheck,
  },
  CANCELED: {
    label: 'Cancelado',
    description: 'Este pedido fue cancelado. Si realizaste un pago, gestionaremos la devolución.',
    badgeClass: 'bg-red-50 text-red-700 border-red-200/90',
    stepIndex: -1,
    Icon: XCircle,
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  if (method === 'TRANSFERENCIA') return 'Transferencia Bancaria';
  return method;
};

function MisComprasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedOrderId = searchParams.get('orderId');

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

  useEffect(() => {
    if (highlightedOrderId) {
      setActiveTab('ALL');
      setPage(1);
    }
  }, [highlightedOrderId]);

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

      let loadedOrders = response.data;

      if (
        highlightedOrderId &&
        page === 1 &&
        activeTab === 'ALL' &&
        !loadedOrders.some((o) => o.id === highlightedOrderId)
      ) {
        try {
          const detailRes = await ordersService.getMyOrderDetail(highlightedOrderId);
          if (detailRes?.data) {
            loadedOrders = [detailRes.data, ...loadedOrders];
          }
        } catch {
        }
      }

      setOrders(loadedOrders);
      setTotalPages(response.meta.totalPages || 1);
      setTotalOrders(response.meta.total);

      if (highlightedOrderId && loadedOrders.some((o) => o.id === highlightedOrderId)) {
        setExpandedOrderIds((prev) => ({
          ...prev,
          [highlightedOrderId]: true,
        }));
      } else if (page === 1 && loadedOrders.length > 0) {
        setExpandedOrderIds((prev) => ({
          ...prev,
          [loadedOrders[0].id]: true,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus compras.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, activeTab, highlightedOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!loading && highlightedOrderId) {
      const el = document.getElementById(`order-${highlightedOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, highlightedOrderId]);

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
        <Loader2 className="w-8 h-8 animate-spin text-[#0056D2]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0056D2] mb-1">
            <Package className="w-3.5 h-3.5" />
            Historial y Seguimiento
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Mis Compras
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Consultá el estado de envío y el detalle de todos tus pedidos ({totalOrders}).
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056D2] text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          Seguir comprando
        </Link>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gray-950 text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-950'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-white border border-gray-200/90 rounded-2xl p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between gap-4">
                <div className="h-5 w-44 bg-gray-200 rounded-lg" />
                <div className="h-6 w-28 bg-gray-200 rounded-full" />
              </div>
              <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-900">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-950 mb-1">
            {activeTab === 'ALL'
              ? 'Todavía no realizaste ninguna compra'
              : 'No tenés pedidos en este estado'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
            {activeTab === 'ALL'
              ? 'Explorá nuestro catálogo y realizá tu primera compra con despacho prioritario y seguimiento en tiempo real.'
              : 'Probá seleccionando otra pestaña de filtro para ver tus demás pedidos.'}
          </p>
          {activeTab === 'ALL' ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0056D2] text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Explorar catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => handleTabChange('ALL')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
            const isCanceled = order.status === 'CANCELED';
            const isHighlighted = highlightedOrderId === order.id;

            return (
              <article
                id={`order-${order.id}`}
                key={order.id}
                className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all ${
                  isHighlighted
                    ? 'border-[#0056D2] ring-2 ring-blue-500/20'
                    : 'border-gray-200/90'
                }`}
              >
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-gray-700 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                        Pedido #{order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Realizado el {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] font-medium text-gray-400">
                        {isCanceled ? 'Monto del pedido' : 'Total abonado'}
                      </span>
                      <span
                        className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                          isCanceled ? 'text-gray-400 line-through' : 'text-gray-950'
                        }`}
                      >
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-xs font-bold text-gray-800 transition-colors cursor-pointer shrink-0"
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

                <div
                  className={`px-5 sm:px-6 py-4 border-b border-gray-100 ${
                    isCanceled ? 'bg-red-50/50' : 'bg-[#F8FAFC]'
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      isCanceled ? 'text-red-700' : 'text-gray-600 mb-3.5'
                    }`}
                  >
                    {statusMeta.description}
                  </p>

                  {!isCanceled && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      {TRACKING_STEPS.map((step, idx) => {
                        const isCompleted = idx <= statusMeta.stepIndex;
                        const StepIcon = step.Icon;
                        return (
                          <div key={step.label} className="flex flex-col">
                            <div
                              className={`h-1.5 rounded-full mb-2 transition-colors ${
                                isCompleted ? 'bg-[#00A859]' : 'bg-gray-200'
                              }`}
                            />
                            <div className="flex items-center gap-1.5">
                              <StepIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isCompleted ? 'text-[#00A859]' : 'text-gray-400'
                                }`}
                              />
                              <span
                                className={`text-[11px] font-semibold truncate ${
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
                  )}
                </div>

                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                            <div className="relative w-14 h-14 rounded-xl border border-gray-200/90 bg-gray-50 overflow-hidden shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  sizes="56px"
                                  className="object-contain p-1.5"
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
                                  className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#0056D2] transition-colors line-clamp-1"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                <p className="text-xs sm:text-sm font-bold text-gray-700 line-clamp-1">
                                  {item.name}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-gray-500 mt-1">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                                  Cant: {item.quantity}
                                </span>
                                <span>× {formatCurrency(item.unit_price)}</span>
                                {item.is_combo && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-[#EA580C] border border-orange-200/80 rounded-md text-[10px] font-extrabold uppercase">
                                    <Layers className="w-2.5 h-2.5" />
                                    Combo Ahorro
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-extrabold text-gray-950">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600 bg-[#F8FAFC] border border-gray-200/70 p-4 rounded-xl">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/80 text-[#0056D2] flex items-center justify-center shrink-0">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 block">Medio de pago</span>
                          <span className="text-gray-600">
                            {formatPaymentMethod(order.payment_method)}
                          </span>
                          {order.coupon_code && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[#00A859] font-bold">
                              <Tag className="w-3 h-3 shrink-0" /> Cupón {order.coupon_code} (-
                              {formatCurrency(order.discount_amount)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/80 text-[#0056D2] flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 block">Entrega</span>
                          <span className="text-gray-600 wrap-break-word">
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

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/80 text-[#0056D2] flex items-center justify-center shrink-0">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 block">Asesor comercial</span>
                          <span className="text-gray-600">
                            {order.advisor ? order.advisor.name : 'Compra directa online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <div className="flex justify-end">
                        <Link
                          href={`/checkout/result?order_id=${order.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056D2] hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl transition-colors"
                        >
                          <span>Verificar estado de acreditación del pago</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-medium text-gray-500">
                Página <strong className="text-gray-900">{page}</strong> de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
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

export default function MisComprasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056D2]" />
        </div>
      }
    >
      <MisComprasContent />
    </Suspense>
  );
}