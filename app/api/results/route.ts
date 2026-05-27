import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchResults } from '@/lib/ipu';
import { log, generateRequestId } from '@/lib/logger';
import { generalRateLimit, getIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const ResultsSchema = z.object({
  sessionId: z.string().regex(/^[A-F0-9]{32}$/),
  semester: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '100']),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  const ip = getIp(request);
  const rl = await generalRateLimit.limit(ip);
  if (!rl.success) {
    log({ step: 'results_fetch', errorCode: 'RATE_LIMITED', requestId });
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

  const parsed = ResultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { sessionId, semester } = parsed.data;

  try {
    const data = await fetchResults(sessionId, semester, requestId);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'SESSION_EXPIRED') {
        log({ step: 'results_fetch', errorCode: 'SESSION_EXPIRED', requestId });
        return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
      }
      if (err.message === 'PORTAL_ERROR') {
        log({ step: 'results_fetch', errorCode: 'PORTAL_ERROR', requestId });
        return NextResponse.json({ error: 'PORTAL_ERROR' }, { status: 502 });
      }
    }
    log({ step: 'results_fetch', errorCode: 'PORTAL_UNREACHABLE', requestId });
    return NextResponse.json({ error: 'PORTAL_UNREACHABLE' }, { status: 502 });
  }
}
