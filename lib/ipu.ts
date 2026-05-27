import { createHash } from 'crypto';
import { parseJsessionId } from './cookies';
import { log } from './logger';
import type { PortalResultResponse } from '../types/result';
import { z } from 'zod';

const BASE_URL = 'https://examweb.ggsipu.ac.in/web';
const BODY_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Origin': 'https://examweb.ggsipu.ac.in',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Keep per-step referers so the portal sees a realistic navigation trail
const COMMON_HEADERS = { ...BASE_HEADERS, 'Referer': 'https://examweb.ggsipu.ac.in/web/login.jsp' };
const RESULTS_HEADERS = { ...BASE_HEADERS, 'Referer': 'https://examweb.ggsipu.ac.in/web/student/studenthome.jsp' };

function makeAbortController(timeoutMs = 8_000): AbortController {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), timeoutMs);
  return ctrl;
}

async function limitedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > BODY_SIZE_LIMIT) {
      reader.cancel();
      throw new Error('BODY_TOO_LARGE');
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(
    chunks.reduce((acc, chunk) => {
      const merged = new Uint8Array(acc.length + chunk.length);
      merged.set(acc);
      merged.set(chunk, acc.length);
      return merged;
    }, new Uint8Array(0))
  );
}

export function hashPassword(password: string, captcha: string): string {
  // Matches portal JS: base64( SHA-256( password + captcha ) ) as raw bytes
  return createHash('sha256').update(password + captcha).digest('base64');
}

export interface CaptchaResult {
  sessionId: string;
  captchaDataUrl: string;
}

export async function fetchCaptcha(requestId: string): Promise<CaptchaResult> {
  const start = Date.now();

  // Step 1: Hit login.jsp to get a fresh JSESSIONID
  const ctrl1 = makeAbortController();
  const loginPageResp = await fetch(`${BASE_URL}/login.jsp`, {
    method: 'GET',
    headers: COMMON_HEADERS,
    redirect: 'manual',
    signal: ctrl1.signal,
  });

  log({ step: 'captcha_fetch', upstreamStatus: loginPageResp.status, requestId });

  const cookies1 = loginPageResp.headers.getSetCookie?.() ?? [];
  let sessionId = parseJsessionId(cookies1);

  if (!sessionId) {
    // Some environments: try reading from the raw header
    const rawCookie = loginPageResp.headers.get('set-cookie') ?? '';
    sessionId = parseJsessionId([rawCookie]);
  }

  if (!sessionId) {
    throw new Error('PORTAL_UNREACHABLE');
  }

  // Step 2: Fetch captcha image with that session
  const ctrl2 = makeAbortController();
  const captchaResp = await fetch(`${BASE_URL}/CaptchaServlet`, {
    method: 'GET',
    headers: {
      ...COMMON_HEADERS,
      Cookie: `JSESSIONID=${sessionId}`,
    },
    redirect: 'manual',
    signal: ctrl2.signal,
  });

  log({ step: 'captcha_fetch', upstreamStatus: captchaResp.status, durationMs: Date.now() - start, requestId });

  if (!captchaResp.ok) {
    throw new Error('PORTAL_UNREACHABLE');
  }

  const contentType = captchaResp.headers.get('content-type') ?? 'image/jpeg';
  const imageBuffer = await captchaResp.arrayBuffer();
  if (imageBuffer.byteLength === 0) {
    throw new Error('PORTAL_UNREACHABLE');
  }

  const base64 = Buffer.from(imageBuffer).toString('base64');
  const captchaDataUrl = `data:${contentType};base64,${base64}`;

  return { sessionId, captchaDataUrl };
}

export interface LoginResult {
  newSessionId: string;
}

export async function login(
  sessionId: string,
  username: string,
  password: string,
  captcha: string,
  requestId: string
): Promise<LoginResult> {
  const start = Date.now();

  // Hash password — plaintext goes out of scope after this line
  const hashedPassword = hashPassword(password, captcha);

  const body = new URLSearchParams({
    username,
    passwd: hashedPassword,
    captcha,
  });

  const ctrl = makeAbortController();
  const resp = await fetch(`${BASE_URL}/Login`, {
    method: 'POST',
    headers: {
      ...COMMON_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `JSESSIONID=${sessionId}`,
    },
    body: body.toString(),
    redirect: 'manual',
    signal: ctrl.signal,
  });

  log({ step: 'login_attempt', upstreamStatus: resp.status, durationMs: Date.now() - start, requestId });

  // Success: 302 with Location pointing to studenthome.jsp
  if (resp.status === 302) {
    const location = resp.headers.get('location') ?? '';
    if (location.includes('studenthome.jsp')) {
      // Capture new JSESSIONID from the 302 response
      const setCookies = resp.headers.getSetCookie?.() ?? [];
      let newSessionId = parseJsessionId(setCookies);

      if (!newSessionId) {
        const rawCookie = resp.headers.get('set-cookie') ?? '';
        newSessionId = parseJsessionId([rawCookie]);
      }

      // If the session wasn't rotated, the old one still works
      if (!newSessionId) {
        newSessionId = sessionId;
      }

      return { newSessionId };
    }
    // Redirect to login.jsp = credentials wrong
    throw new Error('INVALID_CREDENTIALS');
  }

  // 200 = portal re-rendered the login page = failure
  if (resp.status === 200) {
    throw new Error('INVALID_CREDENTIALS');
  }

  throw new Error('PORTAL_UNREACHABLE');
}

// Zod schema to validate the portal's result JSON before passing it through
const StudentProfileSchema = z.object({
  nrollno: z.string(),
  stname: z.string(),
  byoa: z.number(),
  yoa: z.number(),
  prgcode: z.string(),
  prgname: z.string(),
  icode: z.string(),
  iname: z.string(),
});

const PortalResultSchema = z.object({
  report: z.string(),
  stprofile: StudentProfileSchema,
  header: z.array(z.string()),
  stresult: z.array(z.array(z.union([z.string(), z.number()]))),
});

export async function fetchResults(
  sessionId: string,
  semester: string,
  requestId: string
): Promise<PortalResultResponse> {
  const start = Date.now();

  // Real endpoint: GET with query params, not POST with form body.
  // flag=2 is the equivalent of searchMode=2 from the form.
  const url = `${BASE_URL}/StudentSearchProcess?flag=2&euno=${encodeURIComponent(semester)}`;

  const ctrl = makeAbortController();
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      ...RESULTS_HEADERS,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: `JSESSIONID=${sessionId}`,
    },
    redirect: 'manual',
    signal: ctrl.signal,
  });

  log({ step: 'results_fetch', upstreamStatus: resp.status, durationMs: Date.now() - start, requestId });

  if (resp.status === 302) {
    throw new Error('SESSION_EXPIRED');
  }

  if (!resp.ok) {
    throw new Error('PORTAL_UNREACHABLE');
  }

  let rawText: string;
  try {
    rawText = await limitedText(resp);
  } catch {
    throw new Error('PORTAL_ERROR');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('PORTAL_ERROR');
  }

  const validated = PortalResultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('PORTAL_ERROR');
  }

  return validated.data as PortalResultResponse;
}
