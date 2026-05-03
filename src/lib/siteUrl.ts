function normalizeBasePath(baseUrl: string | undefined): string {
  const raw = (baseUrl ?? '/').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function normalizeSiteUrl(value: string): string {
  return value.trim().replace(/\/+$/g, '');
}

/** True if URL string points at localhost or 127.0.0.1 (any port). */
function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url.trim());
  }
}

function isBrowserLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/**
 * Public site origin for auth redirects and absolute URLs.
 * Prefer env when set to a real deployment URL. If env is still localhost (e.g. baked from
 * .env during a production build) but the app runs on a non-local host, use the browser origin
 * so confirmation emails and magic links target the site the user actually opened.
 */
export function getSiteUrl(): string {
  const envUrl = (
    (import.meta.env.VITE_SITE_URL as string | undefined) ||
    (import.meta.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    ''
  ).trim();

  if (typeof window !== 'undefined') {
    const runtime = normalizeSiteUrl(window.location.origin);
    if (envUrl && isLocalhostUrl(envUrl) && !isBrowserLocalhost()) {
      return runtime;
    }
  }

  if (envUrl) {
    return normalizeSiteUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    return normalizeSiteUrl(window.location.origin);
  }

  return 'http://localhost:5173';
}

export function getAuthRedirectUrl(): string {
  const siteUrl = getSiteUrl();
  const basePath = normalizeBasePath(import.meta.env.BASE_URL as string | undefined);
  const callbackPath = `${basePath}/auth/callback`;
  return new URL(callbackPath, `${siteUrl}/`).toString();
}
