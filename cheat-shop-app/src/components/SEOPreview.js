'use client';

import { useState } from 'react';
import { Eye, EyeOff, Globe, Search } from 'lucide-react';

export default function SEOPreview({ translations, productSlug }) {
  const [activeLanguage, setActiveLanguage] = useState('ru');
  const [showPreview, setShowPreview] = useState(false);

  const currentTranslation = translations?.find(t => t.language === activeLanguage) || translations?.[0];

  if (!currentTranslation) {
    return null;
  }

  const previewUrl = typeof window !== 'undefined' 
    ? (activeLanguage === 'ru' 
        ? `${window.location.origin}/ru/product/${productSlug}`
        : `${window.location.origin}/product/${productSlug}`)
    : (activeLanguage === 'ru' 
        ? `/ru/product/${productSlug}`
        : `/product/${productSlug}`);

  return (
    <div className="bg-[#161616] border border-[#383838] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-white" />
          <h3 className="text-lg font-regular text-white">SEO Превью</h3>
        </div>
        <div className="flex items-center space-x-3">
          {/* Переключатель языка */}
          <div className="flex border border-[#383838] rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveLanguage('ru')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeLanguage === 'ru'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white hover:bg-[#262626]'
              }`}
            >
              🇷🇺 RU
            </button>
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeLanguage === 'en'
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white hover:bg-[#262626]'
              }`}
            >
              🇺🇸 EN
            </button>
          </div>
          
          {/* Кнопка показать/скрыть */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#262626] border border-[#383838] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">{showPreview ? 'Скрыть' : 'Показать'}</span>
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="space-y-4">
          {/* Google Search Preview */}
          <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Globe className="h-4 w-4 text-[#989898]" />
              <span className="text-sm text-[#989898]">Google Search Preview</span>
            </div>
            
            <div className="space-y-2">
              {/* URL */}
              <div className="text-sm text-green-400 font-mono">
                {previewUrl}
              </div>
              
              {/* Title */}
              <div className="text-blue-400 text-lg hover:underline cursor-pointer">
                {currentTranslation.metaTitle || `${currentTranslation.name} | AtomCheats`}
              </div>
              
              {/* Description */}
              <div className="text-[#989898] text-sm leading-relaxed">
                {currentTranslation.metaDescription || currentTranslation.description || 'Описание не задано'}
              </div>
            </div>
          </div>

          {/* SEO Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
              <div className="text-sm text-[#989898] mb-1">Meta Title</div>
              <div className="text-white text-sm">
                {currentTranslation.metaTitle ? (
                  <>
                    <span className={currentTranslation.metaTitle.length > 60 ? 'text-red-400' : 'text-green-400'}>
                      {currentTranslation.metaTitle.length}/60
                    </span>
                    <div className="mt-1">{currentTranslation.metaTitle}</div>
                  </>
                ) : (
                  <span className="text-yellow-400">Не задан</span>
                )}
              </div>
            </div>

            <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
              <div className="text-sm text-[#989898] mb-1">Meta Description</div>
              <div className="text-white text-sm">
                {currentTranslation.metaDescription ? (
                  <>
                    <span className={currentTranslation.metaDescription.length > 160 ? 'text-red-400' : 'text-green-400'}>
                      {currentTranslation.metaDescription.length}/160
                    </span>
                    <div className="mt-1 line-clamp-3">{currentTranslation.metaDescription}</div>
                  </>
                ) : (
                  <span className="text-yellow-400">Не задано</span>
                )}
              </div>
            </div>

            <div className="bg-[#262626] border border-[#383838] rounded-xl p-4">
              <div className="text-sm text-[#989898] mb-1">Meta Keywords</div>
              <div className="text-white text-sm">
                {currentTranslation.metaKeywords ? (
                  <div className="line-clamp-3">{currentTranslation.metaKeywords}</div>
                ) : (
                  <span className="text-yellow-400">Не заданы</span>
                )}
              </div>
            </div>
          </div>

          {/* SEO Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="text-blue-400 text-sm font-medium mb-2">💡 SEO Рекомендации</div>
            <ul className="text-[#989898] text-sm space-y-1">
              <li>• Meta Title: 50-60 символов для лучшего отображения в поиске</li>
              <li>• Meta Description: 150-160 символов для полного отображения</li>
              <li>• Keywords: используйте релевантные ключевые слова через запятую</li>
              <li>• Избегайте дублирования контента между языками</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}