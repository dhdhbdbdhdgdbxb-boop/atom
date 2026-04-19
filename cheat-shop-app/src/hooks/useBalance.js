'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function useBalance(autoRefreshInterval = 30000) {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState({
    balanceUsd: 0,
    balanceRub: 0
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync balance from session data
  const syncBalanceFromSession = useCallback(() => {
    if (status === 'authenticated' && session?.user) {
      // Преобразуем Decimal в число
      const balanceUsd = parseFloat(session.user.balance_usd || 0);
      const balanceRub = parseFloat(session.user.balance_ru || 0);
      
      setBalance({
        balanceUsd,
        balanceRub
      });
    } else {
      // Сбрасываем баланс при выходе из системы
      setBalance({ balanceUsd: 0, balanceRub: 0 });
    }
  }, [session, status]);

  const fetchBalance = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Получаем свежий баланс напрямую из API/базы данных
      const response = await fetch('/api/users/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBalance({
            balanceUsd: parseFloat(data.balance.balanceUsd.toString()),
            balanceRub: parseFloat(data.balance.balanceRub.toString())
          });
        } else {
          throw new Error(data.error || 'Failed to fetch balance');
        }
      } else if (response.status === 503) {
        // База данных недоступна - выходим из аккаунта для безопасности
        console.log('Database unavailable, signing out for security');
        await signOut({ redirect: false });
        return;
      } else {
        // Другие ошибки - также выходим из аккаунта
        console.log('API error, signing out');
        await signOut({ redirect: false });
        return;
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
      // При ошибках подключения к БД выходим из аккаунта
      if (err.message?.includes('Database temporarily unavailable') || 
          err.message?.includes('Database unavailable')) {
        console.log('Database unavailable, signing out for security');
        await signOut({ redirect: false });
        return;
      }
      // При других ошибках тоже выходим из аккаунта для безопасности
      console.log('Fetch error, signing out for security');
      await signOut({ redirect: false });
    } finally {
      setLoading(false);
      setInitialLoading(false); // Mark initial loading as complete
    }
  }, [session, status, syncBalanceFromSession]);

  // Force refresh session to update balance in real-time
  const refreshSession = useCallback(async () => {
    if (status !== 'authenticated') {
      return;
    }

    try {
      // Force re-fetch session data by triggering a session refresh
      const response = await fetch('/api/auth/session?update=balance');
      if (response.ok) {
        await fetchBalance();
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      // Fallback to direct balance fetch
      await fetchBalance();
    }
  }, [status, fetchBalance]);

  const updateBalance = useCallback(async (newBalanceData, increment = false) => {
    if (status !== 'authenticated' || !session?.user) {
      return false;
    }

    try {
      const requestData = {
        ...newBalanceData,
        increment
      };

      const response = await fetch('/api/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update balance');
      }

      // Refresh balance after successful update
      await fetchBalance();
      return true;
    } catch (err) {
      console.error('Balance update error:', err);
      setError(err.message);
      return false;
    }
  }, [session, status, fetchBalance]);

  // Load balance from API on authentication and session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Immediately fetch fresh balance from database
      fetchBalance();
    } else {
      // Reset balance when user logs out
      setBalance({ balanceUsd: 0, balanceRub: 0 });
      setInitialLoading(false);
    }
  }, [status, session, fetchBalance]);

  // Set up auto-refresh interval to fetch fresh balance from API
  useEffect(() => {
    if (status === 'authenticated' && session?.user && autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchBalance();
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [status, session, autoRefreshInterval, fetchBalance]);

  return {
    balance,
    loading,
    initialLoading,
    error,
    fetchBalance,
    refreshSession,
    updateBalance,
    isAuthenticated: status === 'authenticated'
  };
}