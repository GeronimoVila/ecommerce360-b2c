'use client';

import { useState } from 'react';
import Image from 'next/image';
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
      <div className="flex flex-col items-center justify-center w-full bg-gray-100 rounded-lg aspect-square border border-gray-200">
        <span className="text-xl font-medium text-gray-400">Sin Imagen Disponible</span>
      </div>
    );
  }

  const activeImage = orderedImages[selectedIndex] || orderedImages[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden bg-white border border-gray-200 rounded-xl aspect-square shadow-sm">
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-2 transition-opacity duration-200"
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
                className={`relative overflow-hidden rounded-lg aspect-square border-2 bg-white transition-all ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600/20'
                    : 'border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-300'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `${productName} - vista ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}