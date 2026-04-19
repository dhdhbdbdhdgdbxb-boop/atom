'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const InstructionModal = ({ isOpen, onClose, title, steps, linkText, linkUrl }) => {
  const { t } = useLanguage();

  // Handle swipe to close
  const handleDragEnd = (event, info) => {
    // If swiped down far enough, close the modal
    if (info.offset.y > 100 && info.velocity.y > 0.5) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
           
          {/* Modal Container - Centered for PC, Bottom Sheet for Mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 35, stiffness: 300, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-800/95 backdrop-blur-2xl border border-slate-700/30 rounded-2xl p-6 shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
               
              <div className="space-y-4 mb-6">
                <ol className="list-decimal list-inside text-slate-300 space-y-2">
                  {(Array.isArray(steps) ? steps : []).map((step, index) => (
                    <li key={index} className="pl-2">{step}</li>
                  ))}
                </ol>
              </div>
               
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-4 rounded-xl text-center transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                >
                  {linkText}
                </a>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium py-3 px-4 rounded-xl text-center transition-all duration-200 ease-in-out"
                >
                  {t('common.close', 'Close')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InstructionModal;