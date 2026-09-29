const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3008/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors: Record<string, string> = {}, public raw?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractErrors(body: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!body || typeof body !== 'object') return fields;
  const b = body as Record<string, unknown>;
  const err = b.error as Record<string, unknown> | undefined;
  const details = err?.details as Record<string, unknown> | undefined;
  const fe = details?.fieldErrors as Record<string, unknown> | undefined;
  if (fe && typeof fe === 'object') {
    for (const [k, v] of Object.entries(fe)) {
      if (Array.isArray(v) && v.length) fields[k] = String(v[0]);
      else if (typeof v === 'string') fields[k] = v;
    }
  }
  return fields;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    let body: unknown = null;
    try {
      body = await response.json();
      const b = body as Record<string, unknown>;
      const err = b?.error as Record<string, unknown> | undefined;
      if (typeof err?.message === 'string') message = err.message;
    } catch { /* non-JSON */ }
    throw new ApiError(response.status, message, extractErrors(body), body);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) => request<T>(p, { method: 'POST', body: b ? JSON.stringify(b) : undefined }),
};
