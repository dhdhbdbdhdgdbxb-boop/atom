'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function TOSPage() {
  const { language } = useLanguage();
  const [tosContent, setTosContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTOS = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine the file path based on the current language
        const filePath = language === 'ru' ? '/files/tos/ru.txt' : '/files/tos/en.txt';
        
        // Fetch the TOS file
        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch TOS file: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setTosContent(text);
      } catch (err) {
        console.error('Error fetching TOS:', err);
        setError(err.message || 'Failed to load Terms of Service');
      } finally {
        setLoading(false);
      }
    };

    fetchTOS();
  }, [language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-slate-300">Loading Terms of Service...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error Loading Terms of Service</h1>
            <p className="text-lg text-slate-300 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="w-full px-4 sm:px-8 lg:px-48 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-normal text-left mt-16 mb-8 text-white">
            {language === 'ru' ? 'Условия использования' : 'Terms of Service'}
          </h1>
          
          <div>
            <pre className="text-slate-300 text-base lg:text-lg leading-relaxed whitespace-pre-wrap font-sans">
              {tosContent}
            </pre>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}