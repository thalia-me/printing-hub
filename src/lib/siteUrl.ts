/**
 * Centralized Site URL helper for Printing Hub.
 *
 * Guarantees a single source of truth for all customer QR codes,
 * storefront poster QR codes, and pickup receipt links.
 */

/**
 * Checks if a given URL string points to localhost, loopback, or private RFC1918 addresses.
 */
export function isPrivateOrLocalAddress(urlStr: string): boolean {
  if (!urlStr) return true;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return true;
    }
    if (host.startsWith('192.168.') || host.startsWith('10.')) {
      return true;
    }
    // 172.16.0.0 – 172.31.255.255
    const parts = host.split('.').map(Number);
    if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Returns the configured production or development site URL without trailing slash.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // In the browser, fall back to current origin if in development
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }

  return '';
}

