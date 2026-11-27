"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { authService } from '@/src/services/auth.service';
import { useAuthStore } from '@/src/store/authStore';

function getSafeRedirect(rawRedirect: string | null): string {
  if (!rawRedirect) return '/';
  if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
    return rawRedirect;
  }
  return '/';
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = getSafeRedirect(searchParams.get('redirect'));

  const { setSession, isAuthenticated, isChecking } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isChecking, isAuthenticated, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const data = await authService.login({
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
        rememberMe: formData.get('rememberMe') === 'on',
      });

      setSession(data.user);
      router.push(redirectTarget);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const registerHref =
    redirectTarget !== '/'
      ? `/checkout/register?redirect=${encodeURIComponent(redirectTarget)}`
      : '/checkout/register';

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#F8FAFC] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight pt-1">
            Iniciar Sesión
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Ingresá a tu cuenta para gestionar tus pedidos y datos de envío.
          </p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-200/90 space-y-6">
          {redirectTarget.startsWith('/checkout/') && (
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0056D2] bg-blue-50/80 border border-blue-200/80 py-2.5 px-3.5 rounded-xl">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Iniciá sesión o registrate para continuar con tu compra.</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 text-xs sm:text-sm text-red-900 bg-red-50 border border-red-200 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Correo Electrónico
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer select-none">
                <input
                  name="rememberMe"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-[#0056D2] border-gray-300 rounded focus:ring-blue-500/20"
                />
                Mantener sesión iniciada
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0056D2] hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mi cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                ¿Todavía no tenés cuenta?{' '}
                <Link
                  href={registerHref}
                  className="font-bold text-[#0056D2] hover:text-blue-800 hover:underline"
                >
                  Registrate como cliente
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#00A859]" />
          <span>Acceso protegido con cifrado de extremo a extremo</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056D2]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}