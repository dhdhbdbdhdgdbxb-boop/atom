'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNotification } from '@/components/NotificationComponent';

export default function AdminAuthPage() {
  const { addNotification } = useNotification();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [twoFaToken, setTwoFaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFA, setRequiresTwoFA] = useState(false);
  const { t } = useLanguage();

  const router = useRouter();

  const getLocalizedContent = () => {
    return {
      login: {
        title: t('admin.auth.login.title', 'Панель управления'),
        subtitle: t('admin.auth.login.subtitle', 'Доступ только для администраторов'),
        button: t('admin.auth.login.button', 'Войти в панель'),
        switchText: t('admin.auth.login.switchText', 'Нужен доступ? Обратитесь к администратору'),
      },
      register: {
        title: t('admin.auth.register.title', 'Запрос доступа'),
        subtitle: t('admin.auth.register.subtitle', 'Заполните форму для получения прав администратора'),
        button: t('admin.auth.register.button', 'Отправить запрос'),
        switchText: t('admin.auth.register.switchText', 'Уже есть доступ?'),
        switchLink: t('admin.auth.register.switchLink', 'Войти в систему')
      },
      fields: {
        login: t('admin.auth.fields.login', 'Логин'),
        password: t('admin.auth.fields.password', 'Пароль'),
        username: t('admin.auth.fields.username', 'Имя администратора'),
        adminKey: t('admin.auth.fields.adminKey', 'Ключ доступа'),
        confirmPassword: t('admin.auth.fields.confirmPassword', 'Подтверждение пароля')
      },
      errors: {
        invalidLogin: t('admin.auth.errors.invalidLogin', 'Логин должен содержать минимум 3 символа'),
        shortPassword: t('admin.auth.errors.shortPassword', 'Пароль должен содержать минимум 8 символов'),
        passwordsNotMatch: t('admin.auth.errors.passwordsNotMatch', 'Пароли не совпадают'),
        shortUsername: t('admin.auth.errors.shortUsername', 'Имя должно содержать минимум 3 символа'),
        invalidAdminKey: t('admin.auth.errors.invalidAdminKey', 'Неверный ключ доступа')
      }
    };
  };

  const content = getLocalizedContent();
  const currentMode = mode === 'login' ? content.login : content.register;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Валидация
    if (!login || login.length < 3) {
      addNotification('Логин должен содержать минимум 3 символа', 'error');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      addNotification(content.errors.shortPassword, 'error');
      setIsLoading(false);
      return;
    }

    if (mode === 'register') {
      if (username.length < 3) {
        addNotification(content.errors.shortUsername, 'error');
        setIsLoading(false);
        return;
      }
      if (!adminKey) {
        addNotification(content.errors.invalidAdminKey, 'error');
        setIsLoading(false);
        return;
      }
    }

    try {
      let response;
      const endpoint = mode === 'login' ? '/api/admin/login' : '/api/admin/register';
      
      if (mode === 'login') {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login,
            password,
            twoFaToken: requiresTwoFA ? twoFaToken : undefined,
          }),
          credentials: 'include' // Включаем cookies
        });
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login,
            password,
            username,
            adminKey,
          }),
          credentials: 'include' // Включаем cookies
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Токен сохраняется автоматически через cookies
        // Перенаправляем на страницу админки
        router.push('/admin/dashboard');
      } else if (data.requiresTwoFA) {
        // Требуется 2FA
        setRequiresTwoFA(true);
        addNotification(data.error || 'Enter 2FA code', 'info');
      } else {
        addNotification(data.error || 'Ошибка авторизации', 'error');
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      addNotification('Ошибка соединения с сервером', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <>
      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0 opacity-50"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-lg"
          >
            {/* Заголовок с иконкой админки */}
            <div className="text-center mb-8">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <motion.h1
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {currentMode.title}
              </motion.h1>
              <motion.p
                className="text-slate-300 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {currentMode.subtitle}
              </motion.p>
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <>
                    <motion.div
                      key="username-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          placeholder={content.fields.username}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-slate-800/40 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:bg-slate-800/60 transition-colors text-base cursor-text placeholder-slate-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      key="admin-key-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Shield className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          placeholder={content.fields.adminKey}
                          value={adminKey}
                          onChange={(e) => setAdminKey(e.target.value)}
                          className="w-full bg-slate-800/40 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:bg-slate-800/60 transition-colors text-base cursor-text placeholder-slate-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Login поле */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={content.fields.login}
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none text-base transition-colors hover:cursor-pointer"
                    required
                    autoComplete="off"
                  />
                </div>
              </motion.div>

              {/* Пароль поле */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={content.fields.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none text-base transition-colors hover:cursor-pointer"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors hover:cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* 2FA поле */}
              <AnimatePresence>
                {requiresTwoFA && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="2FA Code"
                        value={twoFaToken}
                        onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none text-base transition-colors hover:cursor-pointer"
                        maxLength={6}
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Кнопка отправки */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base h-14 hover:cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    {t('admin.auth.loading', 'Проверка доступа...')}
                  </div>
                ) : (
                  currentMode.button
                )}
              </motion.button>
            </form>

            {/* Переключение между логином и регистрацией */}
            <motion.div
              className="text-center mt-8 pt-6 border-t border-white/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              {mode === 'login' ? (
                <p className="text-slate-300 text-sm">
                  {currentMode.switchText}
                </p>
              ) : (
                <p className="text-slate-300 text-sm">
                  {currentMode.switchText}{' '}
                  <button
                    onClick={toggleMode}
                    className="text-white hover:text-gray-300 font-medium transition-colors hover:cursor-pointer text-sm"
                  >
                    {currentMode.switchLink}
                  </button>
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}