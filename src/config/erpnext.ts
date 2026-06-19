const baseUrl = import.meta.env.VITE_ERPNEXT_BASE_URL?.trim().replace(/\/+$/, '');

export const erpnextConfig = {
  baseUrl,
  isConfigured: Boolean(baseUrl),
};

export function buildErpnextUrl(path: string) {
  if (!baseUrl) {
    throw new Error('ERPNext base URL is not configured.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/erpnext${normalizedPath}`;
}

export function buildErpnextHeaders() {
  if (!baseUrl) {
    throw new Error('ERPNext base URL is not configured.');
  }

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}
