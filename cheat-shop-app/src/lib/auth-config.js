import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from './prisma.js';
import Credentials from "@auth/core/providers/credentials";
import bcrypt from 'bcryptjs';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              username: true,
              email: true,
              password: true,
              image: true,
              balanceUsd: true,
              balanceRub: true
            }
          });

          console.log('User found:', user ? 'Yes' : 'No');

          if (!user || !user.password) {
            console.log('User not found or no password');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            return null;
          }

          const userResult = {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            balance_usd: parseFloat(user.balanceUsd.toString()),
            balance_ru: parseFloat(user.balanceRub.toString()),
            image: user.image
          };

          console.log('Returning user:', { id: userResult.id, email: userResult.email, name: userResult.name });
          return userResult;
        } catch (error) {
          console.error('Database connection error during authorization:', error);
          // При ошибке подключения к БД возвращаем null, но не логируем как критическую ошибку
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Если это новый пользователь (при входе)
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.balance_usd = parseFloat(user.balance_usd || user.balanceUsd || 0);
        token.balance_ru = parseFloat(user.balance_ru || user.balanceRub || 0);
        return token;
      }
      
      // Если токен не существует или не содержит ID пользователя, возвращаем null
      if (!token || !token.id) {
        return null;
      }
      
      // Проверяем, существует ли пользователь в базе данных
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: parseInt(token.id) },
          select: { id: true }
        });
        
        if (!userExists) {
          // Если пользователь не найден, возвращаем null для инвалидации токена
          console.log('User not found in database, invalidating token');
          return null;
        }
      } catch (error) {
        console.error('Database connection error during JWT callback:', error);
        // Если база данных недоступна, инвалидируем токен для безопасности
        if (error.code === 'P1001') {
          console.log('Database unavailable, invalidating token for security');
          return null;
        }
        // Для других ошибок тоже инвалидируем токен
        console.log('Database error, invalidating token');
        return null;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Если токен отсутствует или недействителен, возвращаем null
      if (!token || !token.id || !token.username) {
        return null;
      }
      
      // Убеждаемся, что session и session.user существуют
      if (!session) {
        session = {};
      }
      if (!session.user) {
        session.user = {};
      }
      
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.balance_usd = parseFloat(token.balance_usd || 0);
      session.user.balance_ru = parseFloat(token.balance_ru || 0);
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Если URL начинается с baseUrl, используем его
      if (url.startsWith(baseUrl)) return url;
      // Если URL начинается с "/", добавляем baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // В остальных случаях возвращаем baseUrl
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'atomcheats.com' : undefined
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'atomcheats.com' : undefined
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  logger: {
    error: (message, metadata) => {
      console.error('NextAuth Error:', message);
      if (metadata) {
        console.error('Error metadata:', metadata);
      }
    },
    warn: (message) => console.warn('NextAuth Warn:', message),
    debug: (message) => console.debug('NextAuth Debug:', message),
  },
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
};