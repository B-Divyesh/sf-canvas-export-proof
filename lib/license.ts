export const PRODUCT_SLUG = 'canvas-export-proof';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const BILLING_BASE = 'https://api.sociobot.in/api/v1';
const DAY = 86_400_000;

type Verdict = { valid: boolean; checkedAt: number; reason?: string };

export function captureReturnedLicense(search = window.location.search): string | null {
  const params = new URLSearchParams(search);
  const token = params.get('license')?.trim();
  if (!token) return null;
  localStorage.setItem(LICENSE_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  params.delete('license');
  const next = `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`;
  history.replaceState({}, '', next);
  return token;
}

export function saveLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function getCachedLicenseState(): { token: string | null; valid: boolean; fresh: boolean } {
  const token = localStorage.getItem(LICENSE_KEY);
  let verdict: Verdict | null = null;
  try { verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as Verdict | null; } catch { /* ignore damaged cache */ }
  return {
    token,
    valid: Boolean(token && verdict?.valid),
    fresh: Boolean(verdict && Date.now() - verdict.checkedAt < DAY)
  };
}

export async function verifyLicense(force = false): Promise<Verdict> {
  const cached = getCachedLicenseState();
  if (!cached.token) return { valid: false, checkedAt: Date.now(), reason: 'missing' };
  if (cached.fresh && !force) return { valid: cached.valid, checkedAt: Date.now(), reason: 'cached' };
  try {
    const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(cached.token)}`);
    if (!response.ok) throw new Error(`Verification returned ${response.status}`);
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return { valid: cached.valid, checkedAt: Date.now(), reason: 'offline' };
  }
}
