'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function ProductImageSlider({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = () => {
    if (images.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }
  };

  const handleSwipeRight = () => {
    if (images.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full aspect-video bg-white/5 rounded-xl overflow-hidden backdrop-blur-lg group">
      {/* Индикатор текущей картинки */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1}/{images.length}
        </div>
      )}
      {/* Основное изображение */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="relative w-full h-full"
        >
          <Image
            src={images[currentIndex]}
            alt={`Product image ${currentIndex + 1}`}
            className="object-cover"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority={currentIndex === 0}
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Затемнение снизу для лучшей видимости полосок (опционально) */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Навигационные индикаторы */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="group/item relative flex-1 py-3 focus:outline-none cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            >
              {/* Фоновая подложка (тонкая полоска) */}
              <div 
                className={`h-[2px] w-full rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                    : 'bg-white/20 group-hover/item:bg-white/40'
                }`}
              />
              
              {/* Увеличенная невидимая область для клика создается за счет py-3 выше */}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}