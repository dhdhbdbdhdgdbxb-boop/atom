'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Check, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useNotification } from '@/components/NotificationComponent';

function AuthContent() {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Check URL parameter on load
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(`/${language}`);
    }
  }, [status, router, language]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when field changes
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Form submitted:', { isLogin, email: formData.email });

    try {
      if (isLogin) {
        console.log('Attempting login...');
        // Login logic through NextAuth
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        console.log('SignIn result:', result);

        if (result?.error) {
          console.log('SignIn error:', result.error);
          setError(t('auth.errors.invalidCredentials', 'Invalid email or password'));
        } else if (result?.ok) {
          console.log('SignIn successful, redirecting...');
          setError('');
          // Принудительно обновляем сессию и перенаправляем
          window.location.href = `/${language}`;
        } else {
          console.log('SignIn result:', result);
          setError(t('auth.errors.server', 'Server error. Please try again later'));
        }
      } else {
        // Registration logic
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Registration successful - perform auto login through NextAuth
          setError('');
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (result?.error) {
            setError(t('auth.errors.invalidCredentials', 'Invalid email or password'));
          } else {
            // Redirect to main page after successful auto login
            router.push(`/${language}`);
          }
        } else {
          // Handle errors with codes
          switch (data.code) {
            case 'USER_EXISTS':
              setError(t('auth.errors.userExists', 'User with this username already exists'));
              break;
            case 'EMAIL_EXISTS':
              setError(t('auth.errors.emailExists', 'User with this email already exists'));
              break;
            case 'VALIDATION_ERROR':
              setError(t('auth.errors.validation', 'All fields are required'));
              break;
            default:
              setError(t('auth.errors.server', 'Server error. Please try again later'));
          }
        }
      }
    } catch (err) {
      setError(t('auth.errors.server', 'Server error. Please try again later'));
      addNotification(t('auth.errors.server', 'Server error. Please try again later'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    
    const newParams = new URLSearchParams(searchParams.toString());
    if (newMode) {
      newParams.set('mode', 'login');
    } else {
      newParams.set('mode', 'register');
    }
    
    router.replace(`/auth?${newParams.toString()}`, { scroll: false });
    
    setFormData({
      email: '',
      password: '',
      username: ''
    });
    setError('');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  };

  const usernameFieldVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      height: 0,
      transition: { duration: 0.15 }
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-24 cursor-default flex items-center justify-center">
          <div className="text-white text-xl">{t('common.loading', 'Loading...')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-900 pt-24 cursor-default">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: 'url(/images/background-2.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-48 py-16">
          <div className="max-w-md mx-auto">
            {/* Auth Card */}
            <motion.div
              className="p-4 sm:p-6 md:p-8 lg:p-10"
              initial="hidden"
              animate="visible"
              variants={formVariants}
            >
              {/* Header */}
              <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <motion.h1 
                  className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4"
                  style={{ fontFamily: 'var(--font-manrope)' }}
                >
                  {isLogin ? t('auth.title.login', 'Sign In') : t('auth.title.register', 'Sign Up')}
                </motion.h1>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl sm:rounded-2xl text-red-200 flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base"
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? 'login' : 'register'}
                  onSubmit={handleSubmit}
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4 sm:space-y-6"
                  autoComplete="off"
                >
                  {/* Username Field (only for register) */}
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        variants={usernameFieldVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative"
                      >
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800/40 text-white rounded-xl sm:rounded-2xl pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 focus:outline-none focus:bg-slate-800/60 transition-colors text-sm sm:text-base cursor-text placeholder-slate-500"
                          placeholder={t('auth.form.username', 'Your username')}
                          required={!isLogin}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          minLength="3"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/40 text-white rounded-xl sm:rounded-2xl pl-11 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 focus:outline-none focus:bg-slate-800/60 transition-colors text-sm sm:text-base cursor-text placeholder-slate-500"
                      placeholder={t('auth.form.email', 'Your email')}
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/40 text-white rounded-xl sm:rounded-2xl pl-11 sm:pl-14 pr-11 sm:pr-14 py-3 sm:py-4 focus:outline-none focus:bg-slate-800/60 transition-colors text-sm sm:text-base cursor-text placeholder-slate-500"
                      placeholder={t('auth.form.password', 'Your password')}
                      required
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                  </div>

                  {/* Remember Me and Forgot Password (only for login) */}
                  <AnimatePresence mode="wait">
                    {isLogin && (
                      <motion.div
                        variants={formVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex items-center justify-between"
                      >
                        {/* Remember Me Checkbox */}
                        <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-md flex items-center justify-center transition-colors ${
                              rememberMe 
                                ? 'bg-cyan-600 border-cyan-600' 
                                : 'bg-slate-800/40 border-slate-400'
                            }`}>
                              {rememberMe && (
                                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <span className="text-slate-300 text-xs sm:text-sm font-medium">
                            {t('auth.form.rememberMe', 'Remember me')}
                          </span>
                        </label>

                        {/* Forgot Password */}
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          {t('auth.buttons.forgotPassword', 'Forgot password?')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-colors cursor-pointer text-sm sm:text-base"
                    whileTap={{ scale: 0.98 }}
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {loading ? t('auth.buttons.loading', 'Loading...') : 
                     isLogin ? t('auth.buttons.login', 'Sign In') : t('auth.buttons.register', 'Create Account')}
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Switch Auth Mode */}
              <div className="mt-6 sm:mt-8 text-center">
                <button
                  onClick={toggleAuthMode}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-sm sm:text-base cursor-pointer"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <span className="text-slate-400 font-regular">
                    {isLogin ? t('auth.buttons.switchToRegister', "Don't have an account?") : t('auth.buttons.switchToLogin', 'Already have an account?')}
                  </span>{' '}
                  <span className="text-cyan-400 hover:text-cyan-300 font-regular">
                    {isLogin ? t('auth.buttons.register', 'Sign up') : t('auth.buttons.login', 'Sign in')}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-24 cursor-default flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      </>
    }>
      <AuthContent />
    </Suspense>
  );
}