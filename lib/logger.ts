type AllowedFields = {
  step?: 'captcha_fetch' | 'login_attempt' | 'results_fetch';
  upstreamStatus?: number;
  durationMs?: number;
  errorCode?: 'PORTAL_UNREACHABLE' | 'INVALID_CREDENTIALS' | 'PARSE_ERROR' | 'SESSION_EXPIRED' | 'INVALID_INPUT' | 'RATE_LIMITED' | 'PORTAL_ERROR';
  requestId?: string;
};

const ALLOWED_KEYS: ReadonlySet<string> = new Set(['step', 'upstreamStatus', 'durationMs', 'errorCode', 'requestId']);

export function log(fields: AllowedFields): void {
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in fields) {
      sanitized[key] = (fields as Record<string, unknown>)[key];
    }
  }
  console.log(JSON.stringify(sanitized));
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}
