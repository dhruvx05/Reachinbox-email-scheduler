import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const providers: any[] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  }),
];

// Optional dev login provider only active if explicitly enabled in env
if (process.env.ENABLE_DEV_LOGIN === 'true') {
  providers.push(
    CredentialsProvider({
      name: 'Development Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@reachinbox.ai' },
        name: { label: 'Name', type: 'text', placeholder: 'ReachInbox User' },
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return {
            id: '1',
            name: credentials.name || 'ReachInbox User',
            email: credentials.email,
            image: 'https://avatars.githubusercontent.com/u/100000?v=4',
          };
        }
        return null;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'reachinbox_super_secret_jwt_key_2026',
};
