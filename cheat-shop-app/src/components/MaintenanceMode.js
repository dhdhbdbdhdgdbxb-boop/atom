"use client";

import { useLanguage } from '@/i18n/LanguageContext';

export default function MaintenanceMode() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background grid image with overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/backgrounds/grid.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 z-0" />
      
      <div className="text-center max-w-md mx-auto p-8 relative z-10">
        {/* Error icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-3xl lg:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: 'var(--font-manrope)' }}
        >
          {t('common.maintenanceMode.title', 'Нет подключения')}
        </h1>

        {/* Description */}
        <p
          className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {t('common.maintenanceMode.message', 'Сайт временно недоступен. Проверьте подключение к интернету и повторите попытку.')}
        </p>
      </div>
    </div>
  );
}