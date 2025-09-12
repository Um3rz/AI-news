import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/feed',
    '/onboarding',
    '/api/posts',
    '/api/user/:path*',
  ],
};
