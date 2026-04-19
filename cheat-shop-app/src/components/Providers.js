'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from './NotificationComponent';

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  );
}
