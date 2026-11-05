"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/navigation';
import { authService } from '@/src/services/auth.service';
import { useCartStore } from '@/src/store/cartStore'; 

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      await authService.registerAndLogin({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: password
      });

      const freshItems = useCartStore.getState().items;

      if (freshItems.length > 0) {
        const payload = {
          items: freshItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          paymentMethod: 'MP'
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkout/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
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

      router.push('/checkout');
      router.refresh(); 

    } catch (err: any) {
      setError(err.message || 'Error en el proceso de registro.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h2>
      
      {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input name="first_name" type="text" required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellido</label>
          <input name="last_name" type="text" required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input name="email" type="email" required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <input name="phone" type="tel" required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input name="password" type="password" minLength={8} required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Repetir Contraseña</label>
          <input name="confirmPassword" type="password" minLength={8} required className="w-full mt-1 border-gray-300 rounded-md p-2 border" />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 px-4 mt-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Creando cuenta y conectando con pagos...' : 'Crear Cuenta y Pagar'}
      </button>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </form>
  );
}