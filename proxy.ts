import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Per-request CSP nonce. Next.js automatically stamps this nonce onto its own
// framework/bootstrap inline scripts during SSR, which is what lets hydration
// run under a strict `script-src` (no 'unsafe-inline'). See Next.js CSP guide.
export function proxy(request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // script-src: nonce + strict-dynamic = only our own scripts run (strong XSS guard).
  // style-src keeps 'unsafe-inline' because the app renders inline style={{}} attributes,
  // which CSP nonces cannot cover (nonces apply to <style>/<script> elements, not attributes).
  // connect-src allows ws/wss in dev for Next.js HMR.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Run on page routes only; skip API, static assets, image optimizer, favicon,
    // and link prefetches (which don't need a CSP nonce).
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
