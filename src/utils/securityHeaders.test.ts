import { describe, expect, it } from 'vitest';
import nextConfig, { buildSecurityHeaders } from '../../next.config';

function parseCsp(value: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives.set(name, sources);
  }
  return directives;
}

function headerMap(isDev: boolean): Map<string, string> {
  return new Map(buildSecurityHeaders(isDev).map((header) => [header.key, header.value]));
}

describe('xavfsizlik sarlavhalari', () => {
  it('barcha marshrutlarga qo\'llanadi va X-Powered-By o\'chirilgan', async () => {
    const rules = await nextConfig.headers?.();
    const global = rules?.find((rule) => rule.source === '/:path*');
    expect(global?.headers.map((header) => header.key)).toContain('Content-Security-Policy');
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('production CSP qat\'iy', () => {
    const csp = parseCsp(headerMap(false).get('Content-Security-Policy') ?? '');

    expect(csp.get('default-src')).toEqual(["'self'"]);
    expect(csp.get('object-src')).toEqual(["'none'"]);
    expect(csp.get('base-uri')).toEqual(["'self'"]);
    expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
    expect(csp.get('form-action')).toEqual(["'self'"]);
    expect(csp.get('script-src')).not.toContain("'unsafe-eval'");
    expect(csp.has('upgrade-insecure-requests')).toBe(true);
  });

  it('CSP ilova ishlatadigan tashqi manbalarga ruxsat beradi', () => {
    const csp = parseCsp(headerMap(false).get('Content-Security-Policy') ?? '');

    // next.config.ts dagi remotePatterns bilan mos bo'lishi shart.
    for (const pattern of nextConfig.images?.remotePatterns ?? []) {
      if (pattern instanceof URL) continue;
      expect(csp.get('img-src')).toContain(`https://${pattern.hostname}`);
    }
    // Valyuta kursi API si (src/store/currencyStore.ts).
    expect(csp.get('connect-src')).toContain('https://open.er-api.com');
  });

  it('boshqa himoya sarlavhalari o\'rnatilgan', () => {
    const headers = headerMap(false);
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');

    const maxAge = Number(/max-age=(\d+)/.exec(headers.get('Strict-Transport-Security') ?? '')?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31_536_000);
  });

  it('dev rejimida HMR uchun ruxsatlar bor, HSTS yo\'q', () => {
    const headers = headerMap(true);
    const csp = parseCsp(headers.get('Content-Security-Policy') ?? '');
    expect(csp.get('script-src')).toContain("'unsafe-eval'");
    expect(csp.get('connect-src')).toContain('ws:');
    expect(csp.has('upgrade-insecure-requests')).toBe(false);
    expect(headers.has('Strict-Transport-Security')).toBe(false);
  });
});
