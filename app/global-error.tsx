'use client';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 24, color: '#d32f2f' }}>Something went wrong</h2>
          <p style={{ margin: 0, color: '#666' }}>{error.message || 'An unexpected error occurred'}</p>
        </div>
      </body>
    </html>
  );
}