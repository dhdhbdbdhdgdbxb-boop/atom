"use client";

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const getIcon = (type) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getStyles = (type) => {
    const base = "relative pl-3 pr-4 py-3 rounded-lg backdrop-blur-md";
    
    switch (type) {
      case 'success':
        return `${base} bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300`;
      case 'error':
        return `${base} bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300`;
      case 'warning':
        return `${base} bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-300`;
      default:
        return `${base} bg-slate-500/5 border border-slate-500/20 text-slate-700 dark:text-slate-300`;
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, filter: "blur(8px)" }}
              transition={{ 
                duration: 0.2,
                layout: { duration: 0.15 }
              }}
              className={getStyles(notification.type)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <p className="text-sm font-normal flex-1 leading-relaxed">
                  {notification.message}
                </p>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -m-1"
                  aria-label="Close notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {/* Тонкая анимированная полоска */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-current via-current/30 to-transparent"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                style={{ transformOrigin: "left center" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};