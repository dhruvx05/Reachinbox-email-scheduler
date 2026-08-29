import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const providers: any[] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || '785960651495-k2knh9d1glt7ka7fv8g2pbgpnujk05sg.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
  }),
  CredentialsProvider({
    name: 'Direct Access',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'user@reachinbox.ai' },
      name: { label: 'Name', type: 'text', placeholder: 'ReachInbox User' },
    },
    async authorize(credentials) {
      if (credentials?.email) {
        return {
          id: '1',
          name: credentials.name || 'ReachInbox Demo User',
          email: credentials.email,
          image: 'https://avatars.githubusercontent.com/u/100000?v=4',
        };
      }
      return null;
    },
  }),
];

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure clean redirect to /dashboard on Vercel or localhost
      if (url.includes('/dashboard')) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'reachinbox_super_secret_jwt_key_2026',
};
