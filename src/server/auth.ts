import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { redirect } from 'next/navigation';
import { db } from './db';
import type { Actor, Role } from './domain';

export const DEMO_ACCOUNTS = {
  creator: { email: 'wanjiru@example.com', label: 'Creator: Wanjiru Kamau' },
  brand: { email: 'reviews@example.com', label: 'Brand reviewer: Savanna Brands' },
} as const;

export const demoLoginEnabled = process.env.DEMO_LOGIN === 'true';
export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const providers: NextAuthOptions['providers'] = [];

if (demoLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: 'demo',
      name: 'Demo account',
      credentials: { account: { label: 'Account', type: 'text' } },
      async authorize(credentials) {
        const key = credentials?.account as keyof typeof DEMO_ACCOUNTS | undefined;
        const account = key ? DEMO_ACCOUNTS[key] : undefined;
        if (!account) {
          return null;
        }
        const user = await db.user.findUnique({ where: { email: account.email } });
        return user ? { id: user.id, email: user.email, name: user.name } : null;
      },
    })
  );
}

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await db.user.upsert({
          where: { email: user.email },
          update: {},
          create: { email: user.email, name: user.name ?? user.email, role: 'INFLUENCER' },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const record = await db.user.findUnique({ where: { email: user.email } });
        if (record) {
          token.uid = record.id;
          token.role = record.role as Role;
          token.name = record.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid && token.role) {
        session.user.id = token.uid;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export interface SignedInUser extends Actor {
  name: string;
}

export async function currentUser(): Promise<SignedInUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return null;
  }
  return { id: session.user.id, role: session.user.role, name: session.user.name ?? 'You' };
}

export async function requireUser(role?: Role): Promise<SignedInUser> {
  const user = await currentUser();
  if (!user) {
    redirect('/');
  }
  if (role && user.role !== role) {
    redirect(user.role === 'BRAND' ? '/review' : '/campaigns');
  }
  return user;
}
