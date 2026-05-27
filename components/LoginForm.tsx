'use client';

import { useState, useEffect, useCallback } from 'react';

interface LoginFormProps {
  onLogin: (sessionId: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [captchaDataUrl, setCaptchaDataUrl] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaDataUrl('');
    setError('');
    try {
      const resp = await fetch('/api/captcha');
      const data = await resp.json();
      if (!resp.ok || data.error) {
        setError('Could not load captcha. Try refreshing.');
        return;
      }
      setSessionId(data.sessionId);
      setCaptchaDataUrl(data.captchaDataUrl);
    } catch {
      setError('Could not reach the server. Try refreshing.');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCaptcha();
  }, [loadCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, username, password, captcha }),
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        if (data.error === 'INVALID_CREDENTIALS') {
          setError('Invalid enrollment number, password, or captcha. Please try again.');
        } else if (data.error === 'SESSION_EXPIRED') {
          setError('Session expired. Please refresh the captcha and try again.');
        } else if (data.error === 'RATE_LIMITED') {
          setError('Too many login attempts. Please wait a few minutes and try again.');
        } else {
          setError('The IPU portal is currently unreachable. Please try again later.');
        }
        await loadCaptcha();
        setCaptcha('');
        return;
      }

      onLogin(data.sessionId);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <div style={{
        background: '#1e4d8b',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '4px 4px 0 0',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Guru Gobind Singh Indraprastha University</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Examination Division — Result Portal</div>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #d0d0d0',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px',
        padding: '28px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <form onSubmit={handleSubmit} autoComplete="on">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
              Enrollment Number
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. 01414811922"
              required
              pattern="\d{11}"
              maxLength={11}
              autoComplete="username"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d0d0d0',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d0d0d0',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
              Captcha
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                background: '#f5f5f5',
                border: '1px solid #d0d0d0',
                borderRadius: 4,
                height: 48,
                minWidth: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {captchaLoading ? (
                  <span style={{ fontSize: 12, color: '#555' }}>Loading captcha…</span>
                ) : captchaDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={captchaDataUrl} alt="Captcha" style={{ height: 48, display: 'block' }} />
                ) : (
                  <span style={{ fontSize: 12, color: '#b00020' }}>Failed to load</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => { loadCaptcha(); setCaptcha(''); }}
                disabled={captchaLoading || submitting}
                title="Refresh captcha"
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: 4,
                  padding: '8px 12px',
                  fontSize: 18,
                  cursor: captchaLoading || submitting ? 'not-allowed' : 'pointer',
                  color: '#1e4d8b',
                  minHeight: 44,
                }}
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
              placeholder="Enter captcha text"
              required
              maxLength={32}
              autoComplete="off"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d0d0d0',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#b00020', fontSize: 13, marginBottom: 14, padding: '8px 10px', border: '1px solid #b00020', borderRadius: 4, background: '#fff5f5' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || captchaLoading || !captchaDataUrl}
            style={{
              width: '100%',
              padding: '10px',
              background: submitting || captchaLoading || !captchaDataUrl ? '#999' : '#1e4d8b',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting || captchaLoading || !captchaDataUrl ? 'not-allowed' : 'pointer',
              minHeight: 44,
              transition: 'background 150ms',
            }}
          >
            {submitting ? 'Signing in…' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
