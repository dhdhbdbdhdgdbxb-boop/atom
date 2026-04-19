'use client';

import { useEffect } from 'react';
import { useCatalogUpdates } from '@/hooks/useCatalogUpdates';

/**
 * Компонент для автоматического обновления каталога
 * Добавляется на страницы каталога для отслеживания изменений
 */
export default function CatalogAutoUpdater() {
  const { checkForUpdates } = useCatalogUpdates();

  useEffect(() => {
    // Дополнительная проверка при фокусе на окне
    const handleFocus = () => {
      checkForUpdates();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates]);

  // Компонент невидимый, только для логики
  return null;
}