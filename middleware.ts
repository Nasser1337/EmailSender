export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/campaigns/:path*',
    '/contacts/:path*',
    '/followups/:path*',
    '/settings/:path*',
  ],
}
