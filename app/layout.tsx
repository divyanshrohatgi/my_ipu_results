import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GGSIPU Result Portal',
  description: 'Unofficial result viewer for Guru Gobind Singh Indraprastha University students.',
};

// Nonce-based CSP (see proxy.ts) requires per-request SSR so Next.js can stamp
// the nonce onto its scripts. Opt the whole app out of static prerendering.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer style={{
          textAlign: 'center',
          padding: '20px 16px 32px',
          fontSize: 11,
          color: '#555',
          maxWidth: 720,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          This is an unofficial interface. Your credentials are forwarded directly to the official GGSIPU exam portal
          (examweb.ggsipu.ac.in) over HTTPS and are never stored on our servers. Use at your own discretion.
        </footer>
      </body>
    </html>
  );
}
