
Overview
This is a personal project I built to view and calculate my GGSIPU (Guru Gobind Singh Indraprastha University) exam results in a cleaner, more user-friendly way than the official portal. The official university website is clunky and hard to use, so I created this Next.js app that acts as a secure middleman between my browser and the IPU exam portal.

How It Works
Authentication Flow
1. Getting the Captcha
When I open the app, it calls GET /api/captcha. The server visits the IPU portal's login.jsp page to get a fresh session ID (JSESSIONID), then fetches the captcha image using that session. The app returns both the sessionId and the captcha image (as a base64 data URL) to my browser. I never directly contact examweb.ggsipu.ac.in — everything goes through my server.

2. Logging In
I enter my username, password, and the captcha text. The app sends this to POST /api/login. Before forwarding to the portal, the server hashes my password exactly like the university's website does: it combines my password with the captcha text, runs SHA-256, and encodes it as base64. Then it POSTs to /web/Login with my session ID.

The key trick here is that the server doesn't automatically follow the redirect — it manually reads the 302 response to grab the new rotated JSESSIONID from the Set-Cookie header. This new session ID is what keeps me logged in.

3. Fetching Results
Once logged in, I select my semester and the app calls POST /api/results. The server makes an AJAX request to /web/StudentSearchProcess?flag=2&euno=<semester> with the proper headers and returns my results as JSON.

Session Management
My session ID lives only in React state — it's never stored in localStorage, sessionStorage, or set as a cookie by this app. When I close the tab, the session is gone. The session also automatically expires after 15 minutes of inactivity on the portal's side.

Password Security
The password hashing works like this:

ts
import { createHash } from 'crypto';
const hash = createHash('sha256').update(password + captcha).digest('base64');
This matches exactly what the IPU portal's JavaScript does on their side. My plaintext password is never sent to my server's logs and never returned in any response.

Getting Started (Development)
bash
npm install
npm run dev
Then open http://localhost:3000 in your browser.

Testing the Login Flow
I wrote a script to test the full login chain without using the UI:

bash
# Step 1: Fetch the captcha
IPU_USERNAME=01414811922 IPU_PASSWORD=yourpassword npx tsx scripts/test-login.ts

# Step 2: Open /tmp/captcha.jpg, read the text, then:
IPU_USERNAME=01414811922 IPU_PASSWORD=yourpassword IPU_CAPTCHA=abc123 npx tsx scripts/test-login.ts
This tests captcha fetching → login → results retrieval end-to-end.

Running CI Checks
bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run build       # Next.js build
Deploying to Vercel
If I want to deploy this publicly (or just host it online for myself):

Push the code to GitHub

Import the repo at vercel.com/new

Set these environment variables:

Variable	What It Does
UPSTASH_REDIS_REST_URL	Upstash Redis REST URL (for rate limiting)
UPSTASH_REDIS_REST_TOKEN	Upstash Redis REST token
Important: Without Upstash credentials, the app won't work in production — all login attempts return a 429 error. This is intentional to prevent brute-force attacks.

Setting Up Upstash
Create a free Redis database at upstash.com

Copy the REST URL and token from the dashboard

Add them as environment variables in Vercel

GPA/CGPA Calculation
The lib/credits.ts file maps paper codes to credit values. It starts empty, and I need to fill it in for my specific programme to enable CGPA/SGPA calculations:

ts
// lib/credits.ts
export const CREDITS = {
  "AIDS101": { credits: 4 },
  "AIDS101L": { credits: 2 },
  "AIDS102": { credits: 4 },
  // ... add all my papers here
};
Any paper not in this map gets excluded from GPA calculations and shows a warning below the semester table.

Security
What I'm Protecting Against
Threat	How I Handle It
Someone seeing my password in logs	Passwords are never logged or persisted; session ID lives only in React state
Logs leaking sensitive data	Custom logger strips everything except an explicit allowlist; no console.log in app code (enforced by ESLint)
XSS stealing credentials	Strict Content Security Policy: only my own scripts allowed, no third-party scripts
Click-jacking attacks	X-Frame-Options: DENY + frame-ancestors 'none'
Man-in-the-middle on public WiFi	HTTPS with HSTS (2-year max-age + preload)
Brute-force attacks	Rate limiting: 5 login attempts per 10 minutes per IP (via Upstash Redis)
Broken portal responses	2 MB body limit + Zod schema validation before sending to browser
Server-side request forgery	Only one hardcoded upstream host: examweb.ggsipu.ac.in
Portal hanging forever	10-second timeout on every request
What I Can't Fully Protect Against
If Vercel itself is compromised — someone with access to my deployment could theoretically intercept credentials. I have to trust Vercel and myself as the deployer.

Malicious npm package — if a dependency I use is compromised, it could steal credentials. This is a risk with any Node.js app. I run npm audit in CI and pin dependency versions to reduce this risk.

Vercel's log infrastructure — my logs are structured and don't contain credentials by design, but I still have to trust the log system itself.

My Recommendation
If I were really serious about credential safety, I'd self-host this instead of using a public deployment. It's literally a one-command deploy on Vercel — I'd just fork the repo, set up my own Upstash credentials, and deploy it under my own Vercel account. That way I control everything.
