import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { login } from '@/lib/ipu';
import { log, generateRequestId } from '@/lib/logger';
import { loginRateLimit, getIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const LoginSchema = z.object({
  sessionId: z.string().regex(/^[A-F0-9]{32}$/),
  username: z.string().regex(/^\d{11}$/),
  password: z.string().min(1).max(128),
  captcha: z.string().min(1).max(32).regex(/^[a-zA-Z0-9]+$/),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  const ip = getIp(request);
  const rl = await loginRateLimit.limit(ip);
  if (!rl.success) {
    log({ step: 'login_attempt', errorCode: 'RATE_LIMITED', requestId });
    return NextResponse.json({ error: 'RATE_LIMITED' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { sessionId, username, password, captcha } = parsed.data;

  try {
    const result = await login(sessionId, username, password, captcha, requestId);
    return NextResponse.json({ sessionId: result.newSessionId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_CREDENTIALS') {
        log({ step: 'login_attempt', errorCode: 'INVALID_CREDENTIALS', requestId });
        return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
      }
      if (err.message === 'SESSION_EXPIRED') {
        log({ step: 'login_attempt', errorCode: 'SESSION_EXPIRED', requestId });
        return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
      }
    }
    log({ step: 'login_attempt', errorCode: 'PORTAL_UNREACHABLE', requestId });
    return NextResponse.json({ error: 'PORTAL_UNREACHABLE' }, { status: 502 });
  }
}
