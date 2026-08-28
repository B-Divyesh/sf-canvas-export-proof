import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type StaticWebAppConfig = {
  globalHeaders: Record<string, string>;
  mimeTypes: Record<string, string>;
  routes: Array<{ route: string; headers?: Record<string, string> }>;
};

const configPath = resolve(process.cwd(), 'public/staticwebapp.config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as StaticWebAppConfig;

function header(name: string) {
  return config.globalHeaders[name];
}

function routeHeader(route: string, name: string) {
  return config.routes.find((rule) => rule.route === route)?.headers?.[name];
}

describe('Azure Static Web Apps response policy', () => {
  it('keeps HTML revalidating while assets and the packaged extension are immutable', () => {
    expect(header('Cache-Control')).toBe('public, max-age=300, must-revalidate');
    expect(routeHeader('/assets/*', 'Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(routeHeader('/downloads/*', 'Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('ships a restrictive policy without blocking the explicit license verification API', () => {
    const csp = header('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/unsafe-(inline|eval)/);
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(header('Permissions-Policy')).toContain('camera=()');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
  });

  it('declares the hero AVIF media type', () => {
    expect(config.mimeTypes['.avif']).toBe('image/avif');
  });

  it('copies the response policy into the deployable site after a production build', () => {
    const builtConfigPath = resolve(process.cwd(), 'dist/site/staticwebapp.config.json');
    if (!existsSync(builtConfigPath)) return;
    expect(JSON.parse(readFileSync(builtConfigPath, 'utf8'))).toEqual(config);
  });
});
