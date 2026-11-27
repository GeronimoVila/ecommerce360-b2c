"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Package,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { profileService } from '@/src/services/profile.service';

export default function MiCuentaPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking, setSession } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    phone: '',
    email: '',
  });

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isChecking, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    profileService
      .getMyProfile()
      .then((user) => {
        setFormData({
          first_name: user.customer_profile?.first_name || '',
          last_name: user.customer_profile?.last_name || '',
          dni: user.customer_profile?.dni || '',
          phone: user.customer_profile?.phone || '',
          email: user.email || '',
        });
      })
      .catch((err: any) => {
        setProfileFeedback({
          type: 'error',
          text: err.message || 'No se pudieron cargar los datos de tu perfil.',
        });
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    setSavingProfile(true);

    try {
      const response = await profileService.updateMyProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni,
        phone: formData.phone,
        email: formData.email,
      });

      if (response.user) {
        setSession(response.user);
      }

      setProfileFeedback({
        type: 'success',
        text: response.message || 'Tus datos fueron actualizados correctamente.',
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err.message || 'No se pudo actualizar tu perfil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (passwordForm.new_password.length < 8) {
      setPasswordFeedback({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordFeedback({
        type: 'error',
        text: 'Las contraseñas nuevas no coinciden.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await profileService.changeMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setPasswordFeedback({
        type: 'success',
        text: response.message || 'Contraseña actualizada correctamente.',
      });
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        text: err.message || 'Error al actualizar la contraseña.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (isChecking || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056D2]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const displayName = [formData.first_name, formData.last_name].filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0056D2] mb-1">
            <User className="w-3.5 h-3.5" />
            Configuración de Cuenta
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            {displayName ? `Hola, ${formData.first_name || displayName}` : 'Mi Perfil'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Administrá tus datos personales de facturación y la seguridad de acceso.
          </p>
        </div>

        <Link
          href="/mis-compras"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200/90 hover:border-gray-300 text-gray-800 text-xs sm:text-sm font-bold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Package className="w-4 h-4 text-[#0056D2]" />
          <span>Mis Compras</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>

      <section className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-950">Datos Personales y Facturación</h2>
              <p className="text-xs text-gray-500">
                Se utilizarán para agilizar tus compras y emitir tus comprobantes.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#00A859] border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cuenta Activa
          </span>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-5 sm:p-7 space-y-5">
          {profileFeedback && (
            <div
              role="alert"
              className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs sm:text-sm border ${
                profileFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              {profileFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{profileFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Tu nombre"
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Apellido
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Tu apellido"
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                DNI / Documento
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.dni}
                onChange={(e) =>
                  setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })
                }
                placeholder="Sin puntos ni espacios"
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                WhatsApp / Teléfono de contacto
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +54 9 264 1234567"
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0056D2] hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-950">Seguridad y Contraseña</h2>
            <p className="text-xs text-gray-500">
              Usá una contraseña segura de al menos 8 caracteres.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-5 sm:p-7 space-y-5">
          {passwordFeedback && (
            <div
              role="alert"
              className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs sm:text-sm border ${
                passwordFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{passwordFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Contraseña Actual *
              </label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                placeholder="••••••••"
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Repetí la contraseña"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                className="w-full bg-gray-100/80 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0056D2] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              Al cambiar tu contraseña se mantendrá tu sesión activa.
            </span>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-950 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}