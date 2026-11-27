"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  FileText,
  Zap,
} from 'lucide-react';

export interface StorefrontBannerItem {
  id: string;
  badge_text?: string | null;
  title: string;
  highlight_text?: string | null;
  subtitle?: string | null;
  cta_text: string;
  payment_note?: string | null;
  image_url: string;
  image_badge_text?: string | null;
  link_type: 'PRODUCT' | 'CATEGORY' | 'OFFERS';
  link_target?: string | null;
}

interface PromoCarouselProps {
  banners: StorefrontBannerItem[];
}

function resolveBannerHref(banner: StorefrontBannerItem): string {
  if (banner.link_type === 'PRODUCT' && banner.link_target) {
    return `/productos/${banner.link_target}`;
  }
  if (banner.link_type === 'CATEGORY' && banner.link_target) {
    return `/?category=${banner.link_target}`;
  }
  return '/?offers=true';
}

export default function PromoCarousel({ banners }: PromoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const activeSlide = banners[currentIndex] || banners[0];
  const slideHref = resolveBannerHref(activeSlide);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden mb-10">
      <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center">
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-5">
          {activeSlide.badge_text && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-[#00A859] border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeSlide.badge_text}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-950 tracking-tight leading-[1.12]">
            {activeSlide.title}{' '}
            {activeSlide.highlight_text && (
              <span className="text-[#0056D2] block sm:inline">
                {activeSlide.highlight_text}
              </span>
            )}
          </h1>

          {activeSlide.subtitle && (
            <p className="text-sm sm:text-base text-gray-600 max-w-xl leading-relaxed">
              {activeSlide.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={slideHref}
              className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-blue-700 text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-sm transition-all"
            >
              <span>{activeSlide.cta_text || 'Ver Promociones'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {activeSlide.payment_note && (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                <CreditCard className="w-4 h-4 text-[#00A859]" />
                {activeSlide.payment_note}
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 p-4 sm:p-6 lg:p-8 lg:border-l border-gray-100">
          <Link
            href={slideHref}
            className="group relative block w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-gray-100 shadow-xs"
          >
            <img
              src={activeSlide.image_url}
              alt={activeSlide.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {activeSlide.image_badge_text && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-gray-950/85 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {activeSlide.image_badge_text}
              </span>
            )}
          </Link>
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Anterior promoción"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente promoción"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="lg:col-span-12 flex justify-center gap-1.5 pb-3">
              {banners.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ir al slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-[#0056D2]' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200/80 border-t border-gray-200/80 bg-gray-50/40">
        <div className="flex items-center justify-center gap-3 py-4 px-6">
          <Truck className="w-5 h-5 text-[#0056D2] shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900">Envío Prioritario 24hs</p>
            <p className="text-[11px] text-gray-500">Despacho exprés regional</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-4 px-6">
          <ShieldCheck className="w-5 h-5 text-[#0056D2] shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900">Garantía Oficial 12 Meses</p>
            <p className="text-[11px] text-gray-500">Soporte directo autorizado</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-4 px-6">
          <FileText className="w-5 h-5 text-[#0056D2] shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900">Factura A y B Inmediata</p>
            <p className="text-[11px] text-gray-500">Descarga fiscal instantánea</p>
          </div>
        </div>
      </div>
    </section>
  );
}