// app/not-found.tsx
export default function NotFound() {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '48px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 24 }}>Page Not Found</h2>
      <p style={{ margin: 0, color: '#666' }}>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}