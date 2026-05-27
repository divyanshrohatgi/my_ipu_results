/**
 * End-to-end test against the real IPU portal.
 * This is a throwaway script — do not commit credentials.
 *
 * Usage (PowerShell):
 *   $env:IPU_USERNAME="01414811922"; $env:IPU_PASSWORD="yourpassword"; npx tsx scripts/test-login.ts
 *
 * The script fetches the captcha, saves it to a temp file, opens it automatically,
 * then prompts you to type the captcha text — all in one run.
 */

import { fetchCaptcha, login, fetchResults } from '../lib/ipu';
import * as readline from 'readline';
import { execFile } from 'child_process';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function openFile(filePath: string): void {
  // Use execFile (no shell) so filePath is never interpolated into a shell string
  if (process.platform === 'win32') {
    execFile('cmd.exe', ['/c', 'start', '', filePath]);
  } else if (process.platform === 'darwin') {
    execFile('open', [filePath]);
  } else {
    execFile('xdg-open', [filePath]);
  }
}

async function main() {
  const username = process.env.IPU_USERNAME;
  const password = process.env.IPU_PASSWORD;

  if (!username || !password) {
    console.error('Set IPU_USERNAME and IPU_PASSWORD env vars');
    process.exit(1);
  }

  console.log('Step 1: Fetching captcha...');
  const { sessionId, captchaDataUrl } = await fetchCaptcha('test-script');
  console.log(`  Got sessionId: ${sessionId}`);

  const { writeFileSync } = await import('fs');
  const { tmpdir } = await import('os');
  const { join } = await import('path');
  const captchaPath = join(tmpdir(), 'ipu_captcha.png');
  const base64Data = captchaDataUrl.split(',')[1];
  writeFileSync(captchaPath, Buffer.from(base64Data, 'base64'));
  console.log(`  Captcha saved to: ${captchaPath}`);
  console.log('  Opening image...');
  openFile(captchaPath);

  const captcha = await prompt('  Type the captcha text and press Enter: ');
  if (!captcha) {
    console.error('No captcha entered.');
    process.exit(1);
  }

  console.log(`\nStep 2: Logging in as ${username}...`);
  let newSessionId: string;
  try {
    const result = await login(sessionId, username, password, captcha, 'test-script');
    newSessionId = result.newSessionId;
    console.log(`  Login SUCCESS. New sessionId: ${newSessionId}`);
  } catch (err) {
    console.error(`  Login FAILED: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  console.log('\nStep 3: Fetching results (ALL semesters)...');
  try {
    const data = await fetchResults(newSessionId, '100', 'test-script');
    console.log(`  Student: ${data.stprofile.stname} (${data.stprofile.nrollno})`);
    console.log(`  Programme: ${data.stprofile.prgname}`);
    console.log(`  Institute: ${data.stprofile.iname}`);
    console.log(`  Total result rows: ${data.stresult.length}`);
    console.log(`  First row: ${JSON.stringify(data.stresult[0])}`);
    console.log('\nAll steps passed!');
  } catch (err) {
    console.error(`  Results FAILED: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
