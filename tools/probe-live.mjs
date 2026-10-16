import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const requestedOrigin = new URL(process.env.MAGNANEST_PROBE_ORIGIN || 'https://magnanest.pages.dev');
if (requestedOrigin.protocol !== 'https:' || requestedOrigin.username || requestedOrigin.password ||
    requestedOrigin.port || requestedOrigin.pathname !== '/' || requestedOrigin.search || requestedOrigin.hash) {
  throw new Error('The probe origin must be a plain HTTPS website origin.');
}
const origin = requestedOrigin.origin;
const prefix = process.env.MAGNANEST_PROBE_NAME || 'cloudflare';
if (!/^[a-z0-9-]+$/.test(prefix)) throw new Error('Invalid probe output name.');
const review = path.join(root, 'review');
await mkdir(review, { recursive: true });
const files = ['index.html', 'styles.css', 'app.js', 'checkout-config.js', 'assets/editorial-kitchen-720.jpg'];
const hash = body => createHash('sha256').update(body).digest('hex');
const result = {
  checkedAt: new Date().toISOString(),
  origin,
  commit: process.env.GITHUB_SHA || null,
  files: [],
  matchesBuild: false
};
result.files = await Promise.all(files.map(async name => {
  try {
    const response = await fetch(origin + '/' + (name === 'index.html' ? '' : name), {
      signal: AbortSignal.timeout(12000),
      headers: { 'Cache-Control': 'no-cache' }
    });
    const body = Buffer.from(await response.arrayBuffer());
    const expected = await readFile(path.join(root, 'dist', name));
    const record = {
      file: name,
      status: response.status,
      url: response.url,
      bytes: body.length,
      matches: response.ok && hash(body) === hash(expected),
      headers: Object.fromEntries(['server', 'cf-cache-status', 'last-modified', 'etag', 'x-nf-request-id']
        .map(header => [header, response.headers.get(header)]).filter(([, value]) => value !== null))
    };
    if (name === 'index.html') {
      const text = body.toString('utf8');
      record.title = text.match(/<title>([^<]*)<\/title>/i)?.[1] || null;
      record.hasRebuiltHero = text.includes('Your counter.');
      record.hasNewImagery = text.includes('editorial-kitchen-720.jpg');
      await writeFile(path.join(review, prefix + '-live.html'), body);
    }
    return record;
  } catch (error) {
    return { file: name, error: String(error), matches: false };
  }
}));
result.matchesBuild = result.files.every(file => file.matches);
await writeFile(path.join(review, prefix + '-status.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
