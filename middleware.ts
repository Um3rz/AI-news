export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/feed',
    '/onboarding',
    '/api/posts',
    '/api/user/:path*',
  ],
};
