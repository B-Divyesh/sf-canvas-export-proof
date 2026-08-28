import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(process.argv[2] || 'dist/site');
const configPath = path.join(siteRoot, 'staticwebapp.config.json');

if (!fs.existsSync(configPath)) {
  throw new Error(`Missing deploy response policy: ${configPath}`);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const globalHeaders = config.globalHeaders || {};
const routeCache = (route) => config.routes?.find((rule) => rule.route === route)?.headers?.['Cache-Control'];
const immutable = 'public, max-age=31536000, immutable';

if (globalHeaders['Cache-Control'] !== 'public, max-age=300, must-revalidate') {
  throw new Error('HTML must keep a short, revalidating cache policy.');
}
for (const route of ['/assets/*', '/downloads/*']) {
  if (routeCache(route) !== immutable) throw new Error(`${route} must be immutable for one year.`);
}
if (globalHeaders['X-Frame-Options'] !== 'DENY' || !globalHeaders['Content-Security-Policy']?.includes("frame-ancestors 'none'")) {
  throw new Error('Clickjacking protection is incomplete.');
}
if (config.mimeTypes?.['.avif'] !== 'image/avif') {
  throw new Error('AVIF must be served as image/avif.');
}

console.log(`Response policy verified in ${configPath}`);
