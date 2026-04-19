import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './lib/prisma.js';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

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

          if (!user || !user.password) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            balance_usd: parseFloat(user.balanceUsd.toString()),
            balance_ru: parseFloat(user.balanceRub.toString()),
            image: user.image
          };
        } catch (error) {
          console.error('Database connection error during authorization:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.balance_usd = parseFloat(user.balance_usd || 0);
        token.balance_ru = parseFloat(user.balance_ru || 0);
        return token;
      }

      if (!token?.id) return null;

      try {
        const userExists = await prisma.user.findUnique({
          where: { id: parseInt(token.id) },
          select: { id: true }
        });

        if (!userExists) {
          console.log('User not found in database, invalidating token');
          return null;
        }
      } catch (error) {
        console.error('Database connection error during JWT callback:', error);
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !token?.username) return null;

      if (!session.user) session.user = {};

      session.user.id = token.id;
      session.user.username = token.username;
      session.user.balance_usd = parseFloat(token.balance_usd || 0);
      session.user.balance_ru = parseFloat(token.balance_ru || 0);

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth'
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'atomcheats.com' : undefined
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.callback-url'
        : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? 'atomcheats.com' : undefined
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-authjs.csrf-token'
        : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
});
