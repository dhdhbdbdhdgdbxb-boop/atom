'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/utils/imageUtils';

export default function ProductMediaSlider({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoInView, setIsVideoInView] = useState(false);
  const videoRef = useRef(null);
  const sliderRef = useRef(null);

  const handleSwipeLeft = () => {
    if (media.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
    }
  };

  const handleSwipeRight = () => {
    if (media.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + media.length) % media.length);
    }
  };


  const currentMedia = media[currentIndex];

  // Отслеживание видимости слайдера на экране
  useEffect(() => {
    if (!sliderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVideoInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    observer.observe(sliderRef.current);

    return () => {
      if (sliderRef.current) {
        observer.unobserve(sliderRef.current);
      }
    };
  }, []);

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <div ref={sliderRef} className="relative w-full aspect-video bg-white/5 rounded-xl overflow-hidden backdrop-blur-lg group">
      {/* Индикатор текущего медиа */}
      {media.length > 1 && !(currentMedia?.type === 'video' && isVideoInView) && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1}/{media.length}
        </div>
      )}
      
      {/* Кнопки навигации */}
      {media.length > 1 && (
        <>
          <button
            onClick={handleSwipeRight}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleSwipeLeft}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Основное медиа */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full"
        >
          {currentMedia.type === 'image' ? (
            <Image
              src={getMediaUrl(currentMedia.url)}
              alt={`Product media ${currentIndex + 1}`}
              className="object-cover"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority={currentIndex === 0}
              referrerPolicy="no-referrer"
            />
          ) : currentMedia.type === 'video' ? (
            <div className="relative w-full h-full bg-black">
              <video
                ref={videoRef}
                src={getMediaUrl(currentMedia.url)}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                controls
                poster={currentMedia.thumbnail || undefined}
              />
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>


      {/* Затемнение снизу для лучшей видимости полосок */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Навигационные индикаторы */}
      {media.length > 1 && !(currentMedia?.type === 'video' && isVideoInView) && (
        <div className="absolute bottom-4 left-4 right-4 flex space-x-2 z-30">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="group/item relative flex-1 py-3 focus:outline-none cursor-pointer"
              aria-label={`Go to media ${index + 1}`}
            >
              {/* Фоновая подложка */}
              <div
                className={`h-[2px] w-full rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white/20 group-hover/item:bg-white/40'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}