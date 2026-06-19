const baseUrl = import.meta.env.VITE_ERPNEXT_BASE_URL?.trim().replace(/\/+$/, '');
const apiKey = import.meta.env.VITE_ERPNEXT_API_KEY?.trim();
const apiSecret = import.meta.env.VITE_ERPNEXT_API_SECRET?.trim();

export const erpnextConfig = {
  baseUrl,
  apiKey,
  apiSecret,
  isConfigured: Boolean(baseUrl && apiKey && apiSecret),
};

export function buildErpnextUrl(path: string) {
  if (!baseUrl) {
    throw new Error('ERPNext base URL is not configured.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/erpnext${normalizedPath}`;
}

export function buildErpnextHeaders() {
  if (!apiKey || !apiSecret) {
    throw new Error('ERPNext API credentials are not configured.');
  }

  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}
