const PROCUREMENT_API = import.meta.env.VITE_API_URL;
const VENDOR_API = import.meta.env.VITE_VENDOR_API_URL;

if (!PROCUREMENT_API) throw new Error('VITE_API_URL is not set');
if (!VENDOR_API) throw new Error('VITE_VENDOR_API_URL is not set');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error?.message) message = body.error.message;
    } catch {}
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const procurementRequest = <T>(path: string, options?: RequestInit) =>
  request<T>(PROCUREMENT_API, path, options);

export const vendorRequest = <T>(path: string, options?: RequestInit) =>
  request<T>(VENDOR_API, path, options);
