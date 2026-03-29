function normalizeBasePath(baseUrl: string | undefined): string {
  const raw = (baseUrl ?? '/').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function normalizeSiteUrl(value: string): string {
  return value.trim().replace(/\/+$/g, '');
}

export function getSiteUrl(): string {
  const envUrl = (
    (import.meta.env.VITE_SITE_URL as string | undefined) ||
    (import.meta.env.NEXT_PUBLIC_SITE_URL as string | undefined) ||
    ''
  ).trim();

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
