import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession as getNextServerSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name || undefined } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When a user logs in, persist their id on the JWT token in a typed-safe way
      if (user) {
        const u = user as User;
        return { ...token, id: u.id } as JWT & { id: string };
      }
      return token as JWT & { id?: string };
    },
    async session({ session, token }) {
      const s = session as Session & { user?: (Session['user'] & { id?: string }) };
      const t = token as JWT & { id?: unknown };
      const tokenId = typeof t.id === 'string' ? t.id : undefined;
      if (s.user && tokenId) {
        s.user = { ...s.user, id: tokenId } as Session['user'] & { id: string };
      }
      return s;
    },
  },
};

export function getServerSession() {
  return getNextServerSession(authOptions);
}
