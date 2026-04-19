'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LanguageRedirect() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false); // Изменено на false

  useEffect(() => {
    const handleLanguageDetection = async () => {
      try {
        const currentPath = window.location.pathname;
        
        // Определяем текущий язык из URL
        let currentLanguage = 'en'; // По умолчанию английский
        if (currentPath.startsWith('/ru')) {
          currentLanguage = 'ru';
        }
        
        // Сохраняем текущий язык в localStorage (без перенаправления)
        localStorage.setItem('selectedLang', currentLanguage);
        
        // Если это первое посещение, определяем страну для статистики
        const isFirstVisit = !localStorage.getItem('languageDetectedByIP');
        if (isFirstVisit) {
          try {
            const response = await fetch('/api/detect-country');
            const data = await response.json();
            
            if (data.success) {
              localStorage.setItem('languageDetectedByIP', 'true');
              localStorage.setItem('detectedCountry', data.country || 'Unknown');
              localStorage.setItem('isFirstVisit', 'true');
            }
          } catch (error) {
            console.error('Country detection error:', error);
            localStorage.setItem('languageDetectedByIP', 'true');
            localStorage.setItem('isFirstVisit', 'true');
          }
        }
      } catch (error) {
        console.error('Language detection error:', error);
      } finally {
        setIsRedirecting(false);
      }
    };

    // Запускаем определение языка без перенаправления
    handleLanguageDetection();
  }, [router]);

  // Больше не показываем индикатор загрузки
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}