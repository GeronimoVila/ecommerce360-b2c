"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';
import { authService } from '@/src/services/auth.service';
import { useAuthStore } from '@/src/store/authStore';
import { useCartStore } from '@/src/store/cartStore';

const getFormString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

function getSafeRedirect(rawRedirect: string | null): string | null {
  if (!rawRedirect) return null;
  if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
    return rawRedirect;
  }
  return null;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = getSafeRedirect(searchParams.get('redirect'));

  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const first_name = getFormString(formData, 'first_name');
    const last_name = getFormString(formData, 'last_name');
    const email = getFormString(formData, 'email');
    const phone = getFormString(formData, 'phone');
    const dni = getFormString(formData, 'dni').replace(/\D/g, '');
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (dni.length < 7 || dni.length > 11) {
      setError('Ingresá un DNI válido (solo números, entre 7 y 11 dígitos).');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const authResponse = await authService.registerAndLogin({
        first_name,
        last_name,
        email,
        phone,
        dni,
        password,
        rememberMe: true,
      });

      if (authResponse?.user) {
        setSession(authResponse.user);
      }

      if (redirectTarget) {
        router.push(redirectTarget);
        router.refresh();
        return;
      }

      const freshItems = useCartStore.getState().items;

      if (freshItems.length > 0) {
        const payload = {
          items: freshItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          paymentMethod: 'MP',
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkout/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const checkoutUrl = data.init_point || data.checkoutUrl;

          if (checkoutUrl) {
            window.location.href = checkoutUrl;
            return;
          }
        }
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error en el proceso de registro.');
      setLoading(false);
    }
  };

  const loginHref = redirectTarget
    ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
    : '/login';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-200/90 space-y-5"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-gray-950">
            Datos de Registro
          </h2>
          <p className="text-xs text-gray-500">
            Todos los campos son obligatorios para habilitar tu cuenta.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 text-xs sm:text-sm text-red-900 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Nombre *</label>
          <input
            name="first_name"
            type="text"
            required
            placeholder="Ej. Juan"
            className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Apellido *</label>
          <input
            name="last_name"
            type="text"
            required
            placeholder="Ej. Pérez"
            className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            DNI / Documento *
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="dni"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{7,11}"
              maxLength={11}
              placeholder="Ej. 35123456"
              required
              className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            WhatsApp / Teléfono *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="phone"
              type="tel"
              required
              placeholder="Ej. 264 555 1234"
              className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Correo Electrónico *
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Contraseña *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="password"
              type="password"
              minLength={8}
              required
              placeholder="Mín. 8 caracteres"
              className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Repetir Contraseña *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              placeholder="Repetí la clave"
              className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 mt-2 rounded-xl text-sm font-bold text-white bg-[#0056D2] hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <>
            <span>
              {redirectTarget ? 'Crear Cuenta y Continuar al Pago' : 'Crear Cuenta y Continuar'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-4 border-t border-gray-100 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          ¿Ya tenés cuenta?{' '}
          <Link
            href={loginHref}
            className="font-bold text-[#0056D2] hover:text-blue-800 hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </form>
  );
}