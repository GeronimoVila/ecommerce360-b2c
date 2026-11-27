'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
  Landmark,
  User,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Ticket,
  X,
  RotateCcw,
  Headphones,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useCartStore, CheckoutPaymentMethod } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

type DeliveryType = 'SHIPPING' | 'PICKUP';

const PROVINCES_AR = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useStore(useCartStore, (state) => state);
  const auth = useStore(useAuthStore, (state) => state);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('SHIPPING');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [floorApartment, setFloorApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('San Juan');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasPrefilledUser, setHasPrefilledUser] = useState(false);

  useEffect(() => {
    if (!auth || auth.isChecking) return;
    if (!auth.isAuthenticated) {
      router.replace('/checkout/register?redirect=/checkout');
    }
  }, [auth, router]);

  useEffect(() => {
    if (!cart) return;
    cart.syncWithBackend();
  }, [Boolean(cart)]);

  useEffect(() => {
    if (!auth || auth.isChecking || hasPrefilledUser) return;

    let isCancelled = false;

    const applyUserData = (userData: any) => {
      if (!userData || isCancelled) return;
      const profile = userData.customer_profile || userData.profile || {};
      if (profile.first_name) setFirstName((prev) => prev || String(profile.first_name));
      if (profile.last_name) setLastName((prev) => prev || String(profile.last_name));
      if (userData.email) setEmail((prev) => prev || String(userData.email));
      if (profile.phone) setPhone((prev) => prev || String(profile.phone));
      if (profile.dni) setDni((prev) => prev || String(profile.dni));
      setHasPrefilledUser(true);
    };

    if (auth.user?.customer_profile) {
      applyUserData(auth.user);
      return;
    }

    if (auth.isAuthenticated) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((profileUser) => {
          applyUserData(profileUser || auth.user);
        })
        .catch(() => {
          applyUserData(auth.user);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [auth, hasPrefilledUser]);

  const availableInstallments = useMemo(() => {
    if (!cart || cart.paymentMethod === 'TRANSFERENCIA') {
      return [{ installments: 1, interestPercentage: 0 }];
    }

    const planMap = new Map<number, number>();
    planMap.set(1, 0);

    for (const item of cart.items) {
      const plans = item.dynamicPricing?.credit_card || [];
      for (const p of plans) {
        if (p.gateway === cart.paymentMethod) {
          planMap.set(p.installments, p.interest_percentage);
        }
      }
    }

    return Array.from(planMap.entries())
      .map(([installments, interestPercentage]) => ({ installments, interestPercentage }))
      .sort((a, b) => a.installments - b.installments);
  }, [cart]);

  const cashDiscountInfo = useMemo(() => {
    if (!cart) return null;
    for (const item of cart.items) {
      if (item.dynamicPricing?.cash_transfer) {
        return item.dynamicPricing.cash_transfer;
      }
    }
    return null;
  }, [cart]);

  if (!cart || !auth || auth.isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#0056D2] animate-spin" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  if (cart.items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-sm text-gray-500 mb-6">
          Agregá productos antes de iniciar el proceso de compra.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#0056D2] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const baseSubtotal = cart.baseSubtotal || cart.subtotal;
  const subtotal = cart.subtotal;
  const paymentDelta = Math.round((subtotal - baseSubtotal) * 100) / 100;
  const couponDiscount = cart.coupon ? cart.coupon.projectedDiscount : 0;
  const finalTotal = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);
  const installmentAmount =
    cart.installments > 1 ? Math.round((finalTotal / cart.installments) * 100) / 100 : finalTotal;
  const totalUnitsCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  const handleSelectMethod = (method: CheckoutPaymentMethod) => {
    setCouponError(null);
    cart.setPaymentOption(method, 1);
  };

  const handleSelectInstallments = (count: number) => {
    setCouponError(null);
    cart.setPaymentOption(cart.paymentMethod, count);
  };

  const handleApplyCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    setCouponError(null);
    setIsApplyingCoupon(true);

    try {
      const ok = await cart.applyCoupon(cleanCode);
      if (ok) {
        setCouponInput('');
      } else {
        setCouponError('No se pudo validar el cupón.');
      }
    } catch (err: any) {
      setCouponError(err?.message || 'Cupón inválido o no aplicable a esta compra.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponError(null);
    cart.removeCoupon();
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !dni.trim()) {
      setSubmitError('Completá todos los datos de contacto obligatorios, incluyendo el DNI.');
      return;
    }

    if (
      deliveryType === 'SHIPPING' &&
      (!street.trim() || !streetNumber.trim() || !city.trim() || !province.trim() || !postalCode.trim())
    ) {
      setSubmitError('Completá todos los campos de la dirección de envío.');
      return;
    }

    setIsSubmitting(true);

    try {
      await cart.syncWithBackend();
      const freshState = useCartStore.getState();

      if (freshState.items.length === 0) {
        setSubmitError('El carrito quedó vacío tras verificar disponibilidad.');
        setIsSubmitting(false);
        return;
      }

      if (freshState.items.some((i) => Boolean(i.error))) {
        setSubmitError('Uno o más productos no tienen stock suficiente. Revisá el resumen.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        items: freshState.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: freshState.paymentMethod,
        installments: freshState.installments,
        ...(freshState.coupon?.code ? { couponCode: freshState.coupon.code } : {}),
        contact: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          dni: dni.trim(),
        },
        shipping: {
          deliveryType,
          ...(deliveryType === 'SHIPPING'
            ? {
                street: street.trim(),
                streetNumber: streetNumber.trim(),
                floorApartment: floorApartment.trim() || undefined,
                city: city.trim(),
                province: province.trim(),
                postalCode: postalCode.trim(),
              }
            : {}),
          notes: notes.trim() || undefined,
        },
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkout/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push('/checkout/register');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'No se pudo procesar la orden.');
      }

      if (freshState.paymentMethod === 'TRANSFERENCIA') {
        const createdOrderId = data.order?.id;
        cart.clearCart();
        router.push(`/checkout/success?orderId=${encodeURIComponent(createdOrderId)}&gateway=TRANSFERENCIA&outcome=pending`);
        return;
      }

      const checkoutUrl = data.checkoutUrl || data.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('La pasarela no devolvió un enlace de pago válido.');
      }
    } catch (err: any) {
      console.error('[CheckoutPage] Error:', err);
      setSubmitError(err.message || 'Ocurrió un error al generar tu pedido.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-2xl text-sm flex items-start gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No pudimos continuar con el pago</p>
              <p className="text-xs mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-950">
                    1. Datos Personales y Facturación
                  </h2>
                </div>

                {auth?.isAuthenticated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-[#00A859] border border-emerald-200/80 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Verificado
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Ingresá tus datos para la emisión de factura fiscal electrónica A/B y el seguimiento de despacho en tiempo real vía WhatsApp y correo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="comprador@legadohogar.com"
                      className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                    {email && (
                      <CheckCircle2 className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enviaremos la confirmación oficial y comprobante a este email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Alejandro"
                    className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Rossi"
                    className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    DNI / CUIT *
                  </label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej. 35123456"
                    className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    WhatsApp / Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 264 555 1234"
                    className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-950">
                  2. Método de Despacho & Logística
                </h2>
              </div>

              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Seleccioná la modalidad de entrega y completá los datos de destino para asegurar tu despacho prioritario.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('SHIPPING')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    deliveryType === 'SHIPPING'
                      ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Truck
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      deliveryType === 'SHIPPING' ? 'text-[#0056D2]' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-950">Envío a Domicilio</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Despacho por correo o logística propia
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    deliveryType === 'PICKUP'
                      ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Store
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      deliveryType === 'PICKUP' ? 'text-[#0056D2]' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-950">Retiro en Sucursal</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sin costo · Retirás una vez acreditado el pago
                    </p>
                  </div>
                </button>
              </div>

              {deliveryType === 'SHIPPING' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Calle *
                      </label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ej. Av. Libertador Gral. San Martín"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Número *
                      </label>
                      <input
                        type="text"
                        required
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                        placeholder="Ej. 1420"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Piso / Depto / Referencia
                      </label>
                      <input
                        type="text"
                        value={floorApartment}
                        onChange={(e) => setFloorApartment(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Ej. 5400"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Ciudad / Localidad *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej. San Juan"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Provincia *
                      </label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      >
                        {PROVINCES_AR.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Notas de entrega (horarios, timbre, entre calles)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00A859] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {postalCode ? `Código Postal ${postalCode}` : 'Despacho Protegido'} ({city || province})
                          </p>
                          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#00A859] text-white rounded">
                            LOGÍSTICA ASEGURADA
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Entrega express asegurada con póliza contra todo riesgo y seguimiento activo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#00A859] text-white flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        Retiro en Sucursal Central · SIN CARGO
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Te avisaremos por email y notificación en tu cuenta cuando el pedido esté listo para retirar.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nota o persona autorizada a retirar (opcional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Retira María Gómez - DNI 38..."
                      className="w-full border border-gray-200 bg-white rounded-xl px-3.5 py-2 text-sm focus:border-[#0056D2] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-950">
                    3. Selección de Medio de Pago
                  </h2>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0056D2] border border-blue-200/80 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Checkout Blindado
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-5">
                Seleccioná tu método preferido. Todos los importes están garantizados contra aumentos tarifarios.
              </p>

              <div className="space-y-3">
                <div
                  onClick={() => {
                    if (!isSubmitting && !cart.isSyncing) handleSelectMethod('TRANSFERENCIA');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting && !cart.isSyncing) {
                      e.preventDefault();
                      handleSelectMethod('TRANSFERENCIA');
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                    cart.paymentMethod === 'TRANSFERENCIA'
                      ? 'border-[#0056D2] bg-blue-50/20 ring-1 ring-[#0056D2]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          cart.paymentMethod === 'TRANSFERENCIA'
                            ? 'border-[#0056D2]'
                            : 'border-gray-300'
                        }`}
                      >
                        {cart.paymentMethod === 'TRANSFERENCIA' && (
                          <span className="w-2 h-2 rounded-full bg-[#0056D2]" />
                        )}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-950">
                            Transferencia Bancaria / Depósito
                          </span>
                          {cashDiscountInfo && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#00A859] text-white px-2 py-0.5 rounded">
                              -{cashDiscountInfo.discount_percentage}% EXTRA DESCUENTO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ahorrá inmediatamente pagando por transferencia. Verificación rápida y reserva automática de stock.
                        </p>
                      </div>
                    </div>

                    <Landmark className="w-5 h-5 text-[#0056D2] shrink-0" />
                  </div>

                  {cart.paymentMethod === 'TRANSFERENCIA' && (
                    <div className="mt-4 pt-3.5 border-t border-gray-200/80 flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border">
                      <div className="text-xs">
                        <p className="text-[11px] text-gray-500">Modalidad de acreditación:</p>
                        <p className="font-mono font-bold text-gray-900 mt-0.5">
                          CBU / ALIAS EN EL SIGUIENTE PASO
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#00A859] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        Reserva Inmediata
                      </span>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => {
                    if (!isSubmitting && !cart.isSyncing) handleSelectMethod('MOBBEX');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting && !cart.isSyncing) {
                      e.preventDefault();
                      handleSelectMethod('MOBBEX');
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                    cart.paymentMethod === 'MOBBEX'
                      ? 'border-[#0056D2] bg-blue-50/20 ring-1 ring-[#0056D2]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          cart.paymentMethod === 'MOBBEX'
                            ? 'border-[#0056D2]'
                            : 'border-gray-300'
                        }`}
                      >
                        {cart.paymentMethod === 'MOBBEX' && (
                          <span className="w-2 h-2 rounded-full bg-[#0056D2]" />
                        )}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-950">
                            Tarjetas de Crédito y Débito
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0056D2] px-2 py-0.5 rounded">
                            HASTA 12 CUOTAS FIJAS
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pasarela segura certificada PCI-DSS con autenticación 3D Secure 2.0.
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {['VISA', 'MASTERCARD', 'AMEX', 'Mobbex Engine'].map((badge) => (
                            <span
                              key={badge}
                              className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <CreditCard className="w-5 h-5 text-gray-600 shrink-0" />
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!isSubmitting && !cart.isSyncing) handleSelectMethod('MP');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting && !cart.isSyncing) {
                      e.preventDefault();
                      handleSelectMethod('MP');
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                    cart.paymentMethod === 'MP'
                      ? 'border-[#0056D2] bg-blue-50/20 ring-1 ring-[#0056D2]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          cart.paymentMethod === 'MP'
                            ? 'border-[#0056D2]'
                            : 'border-gray-300'
                        }`}
                      >
                        {cart.paymentMethod === 'MP' && (
                          <span className="w-2 h-2 rounded-full bg-[#0056D2]" />
                        )}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-950">Mercado Pago</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            ACREDITACIÓN INSTANTÁNEA
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Usá tu dinero en cuenta, débito automático o tarjeta prepaga vinculada.
                        </p>
                      </div>
                    </div>

                    <Wallet className="w-5 h-5 text-gray-600 shrink-0" />
                  </div>
                </div>
              </div>

              {cart.paymentMethod !== 'TRANSFERENCIA' && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                    Seleccioná el plan de cuotas
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableInstallments.map((plan) => {
                      const isSelected = cart.installments === plan.installments;
                      const isInterestFree = plan.interestPercentage === 0;

                      return (
                        <button
                          key={plan.installments}
                          type="button"
                          disabled={isSubmitting || cart.isSyncing}
                          onClick={() => handleSelectInstallments(plan.installments)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0056D2] bg-blue-50/40 ring-1 ring-[#0056D2]'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {plan.installments === 1
                                ? '1 pago'
                                : `${plan.installments} cuotas`}
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                isInterestFree ? 'text-[#00A859]' : 'text-amber-700'
                              }`}
                            >
                              {plan.installments === 1
                                ? 'Sin interés'
                                : isInterestFree
                                ? 'Sin interés'
                                : `+${plan.interestPercentage}% financiación`}
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#0056D2] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200/80 px-4 py-3 flex items-center gap-2.5 text-[11px] text-gray-500">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  Tus datos bancarios y personales están resguardados con cifrado asimétrico TLS y no se almacenan en servidores externos.
                </span>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-gray-950">Resumen de Orden</h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {totalUnitsCount} {totalUnitsCount === 1 ? 'Artículo' : 'Artículos'}
                </span>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          Foto
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-600 rounded">
                          Cant: {item.quantity}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          × ${Number(item.unitPrice || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-[11px] text-red-600 font-semibold mt-0.5">{item.error}</p>
                      )}
                    </div>

                    <p className="text-sm font-extrabold text-gray-950 shrink-0">
                      ${(Number(item.unitPrice || 0) * item.quantity).toLocaleString('es-AR')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50/90 border border-gray-200/80 rounded-xl p-4 space-y-2.5">
                <label className="block text-xs font-bold text-gray-800">
                  Cupón de Descuento de Vendedor
                </label>

                {cart.coupon ? (
                  <div className="flex items-center justify-between bg-white border border-emerald-200 text-gray-900 px-3 py-2.5 rounded-xl text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-extrabold text-gray-950">
                          {cart.coupon.code}
                        </span>
                        <span className="text-[#00A859] font-semibold ml-1.5">
                          (-${couponDiscount.toLocaleString('es-AR')})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={isSubmitting || cart.isSyncing}
                      aria-label="Quitar cupón"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        disabled={isSubmitting || cart.isSyncing || isApplyingCoupon}
                        placeholder="Ingresá tu código"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono uppercase focus:border-[#0056D2] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={
                          isSubmitting ||
                          cart.isSyncing ||
                          isApplyingCoupon ||
                          !couponInput.trim()
                        }
                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 disabled:text-gray-400 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                      >
                        {isApplyingCoupon ? 'Validando...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] font-semibold text-red-600">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Productos</span>
                  <span className="font-bold text-gray-900">
                    ${baseSubtotal.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    {deliveryType === 'PICKUP'
                      ? 'Retiro en Sucursal'
                      : `Envío Especializado a Domicilio${postalCode ? ` (CP ${postalCode})` : ''}`}
                  </span>
                  <span className="font-extrabold text-[#00A859] uppercase">
                    {deliveryType === 'PICKUP' ? 'GRATIS' : 'A COORDINAR'}
                  </span>
                </div>

                {cart.coupon && (
                  <div className="flex justify-between text-[#00A859] font-semibold">
                    <span>Descuento Cupón ({cart.coupon.code})</span>
                    <span>-${couponDiscount.toLocaleString('es-AR')}</span>
                  </div>
                )}

                {paymentDelta < 0 && (
                  <div className="flex justify-between text-[#00A859] font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Descuento Medio de Pago
                    </span>
                    <span>-${Math.abs(paymentDelta).toLocaleString('es-AR')}</span>
                  </div>
                )}

                {paymentDelta > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Costo financiero ({cart.installments} cuotas)</span>
                    <span>+${paymentDelta.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between items-start">
                  <div>
                    <span className="text-base font-extrabold text-gray-950 block">
                      Total Final a Pagar
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      IVA INCLUIDO
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight block">
                      ${finalTotal.toLocaleString('es-AR')}
                    </span>
                    {finalTotal < baseSubtotal && (
                      <span className="text-xs text-gray-400 line-through block">
                        ${baseSubtotal.toLocaleString('es-AR')}
                      </span>
                    )}
                    {cart.installments > 1 && (
                      <p className="text-xs font-semibold text-[#0056D2] mt-0.5">
                        {cart.installments} cuotas de ${installmentAmount.toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.isSyncing || cart.items.some((i) => Boolean(i.error))}
                  className="w-full bg-[#2E7D5B] hover:bg-[#236347] disabled:bg-gray-300 text-white font-bold py-4 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando orden...
                    </>
                  ) : cart.isSyncing ? (
                    'Actualizando precios...'
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {cart.paymentMethod === 'TRANSFERENCIA'
                        ? 'Confirmar Pedido con Transferencia'
                        : `Confirmar y Pagar con ${cart.paymentMethod === 'MOBBEX' ? 'Mobbex' : 'Mercado Pago'}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}