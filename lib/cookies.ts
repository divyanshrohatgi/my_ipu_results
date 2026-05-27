// Extract JSESSIONID value from Set-Cookie header strings.
// Response.headers.getSetCookie() returns an array of individual header values.
export function parseJsessionId(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    // Each value looks like: JSESSIONID=ABCDEF1234...; Path=/; HttpOnly
    const parts = header.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('JSESSIONID=')) {
        return trimmed.slice('JSESSIONID='.length);
      }
    }
  }
  return null;
}
