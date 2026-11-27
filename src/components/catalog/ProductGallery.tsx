'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import type { ProductImage } from '@/src/types/product';

interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images = [], productName }: ProductGalleryProps) {
  const orderedImages = [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.position - b.position;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (orderedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full bg-white rounded-2xl aspect-square border border-gray-200/90 shadow-xs text-gray-400 gap-2">
        <ImageOff className="w-10 h-10 text-gray-300" />
        <span className="text-sm font-semibold">Sin Imagen Disponible</span>
      </div>
    );
  }

  const activeImage = orderedImages[selectedIndex] || orderedImages[0];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative w-full overflow-hidden bg-white border border-gray-200/90 rounded-2xl aspect-square shadow-xs">
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4 sm:p-6 transition-opacity duration-200"
        />
      </div>

      {orderedImages.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
          {orderedImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Ver imagen ${idx + 1} de ${productName}`}
                className={`relative overflow-hidden rounded-xl aspect-square border-2 bg-white transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0056D2] ring-2 ring-blue-500/20'
                    : 'border-gray-200/90 opacity-75 hover:opacity-100 hover:border-gray-300'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `${productName} - vista ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}