'use client';

import { Suspense } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

// Skeleton компонент для загрузки
function LanguageSwitcherSkeleton({ variant = 'default' }) {
  if (variant === 'footer') {
    return (
      <button className="px-2 py-1 lg:px-4 lg:py-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer font-medium flex items-center justify-center hover:bg-slate-700 transition-colors">
        <div className="w-5 h-4 bg-slate-700 rounded-sm mr-2"></div>
        <span className="text-xs lg:text-sm">Русский</span>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className="w-full max-w-xs flex space-x-2">
        <div className="flex-1 h-10 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="flex-1 h-10 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 p-2">
      <div className="w-16 h-4 bg-slate-700 rounded animate-pulse"></div>
    </div>
  );
}

export default function LanguageSwitcherWrapper(props) {
  return (
    <Suspense fallback={<LanguageSwitcherSkeleton variant={props.variant} />}>
      <LanguageSwitcher {...props} />
    </Suspense>
  );
}
