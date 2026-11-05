"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import { useCartStore } from '@/src/store/cartStore';

export default function Navbar() {
  const { isAuthenticated, user, isChecking, checkSession, logout } = useAuthStore();
  
  const cartItemsCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const openDrawer = useCartStore((state) => state.openDrawer);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="shrink-0 flex items-center">
            <Link href="/" className="text-xl font-extrabold text-blue-600">
              E-Commerce 360
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            
            {!isChecking && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 hidden sm:block">
                      Hola, {user?.email}
                    </span>
                    <button 
                      onClick={logout}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link 
                      href="/login" 
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Iniciar Sesión
                    </Link>
                    <Link 
                      href="/checkout/register" 
                      className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md transition-colors"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </>
            )}

            <button 
              onClick={openDrawer}
              className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}