"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          {redirectTarget.startsWith('/checkout/') && (
            <p className="mt-2 text-center text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 py-2 px-3 rounded-lg">
              Inicia sesión o registrate para continuar con el pago.
            </p>
          )}
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded text-center">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full mt-1 border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                className="w-full mt-1 border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                name="rememberMe"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Mantener sesión iniciada
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href={registerHref} className="font-semibold text-blue-600 hover:underline">
              Regístrate como cliente
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Cargando...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}