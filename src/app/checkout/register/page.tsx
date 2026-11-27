import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import RegisterForm from '@/src/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] bg-[#F8FAFC] flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight pt-1">
          Crear cuenta
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Completá tus datos para gestionar tus pedidos y envíos.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <Suspense
          fallback={
            <div className="p-10 bg-white border border-gray-200/90 shadow-xs rounded-2xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#0056D2]" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#00A859]" />
          <span>Tus datos están protegidos y encriptados</span>
        </div>
      </div>
    </div>
  );
}