'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TOSRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Проверяем сохраненный язык в localStorage
    const savedLang = localStorage.getItem('selectedLang');
    
    // Определяем язык: из localStorage или по умолчанию английский
    const lang = savedLang === 'ru' ? 'ru' : 'en';
    
    // Редиректим на соответствующую языковую версию
    const targetPath = lang === 'ru' ? '/ru/tos' : '/en/tos';
    router.replace(targetPath);
  }, [router]);

  // Показываем загрузку во время редиректа
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-slate-300">Loading...</p>
      </div>
    </div>
  );
}
