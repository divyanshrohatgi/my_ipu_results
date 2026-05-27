import { NextRequest, NextResponse } from 'next/server';
import { fetchCaptcha } from '@/lib/ipu';
import { log, generateRequestId } from '@/lib/logger';
import { generalRateLimit, getIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  const ip = getIp(request);
  const rl = await generalRateLimit.limit(ip);
  if (!rl.success) {
    log({ step: 'captcha_fetch', errorCode: 'RATE_LIMITED', requestId });
    return NextResponse.json({ error: 'RATE_LIMITED' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  try {
    const result = await fetchCaptcha(requestId);
    return NextResponse.json(result);
  } catch (err) {
    const errorCode = err instanceof Error && err.message === 'PORTAL_UNREACHABLE'
      ? 'PORTAL_UNREACHABLE'
      : 'PORTAL_ERROR';
    log({ step: 'captcha_fetch', errorCode, requestId });
    return NextResponse.json({ error: errorCode }, { status: 502 });
  }
}
