const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
    public formError: string | null = null,
    public raw?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractErrors(body: unknown): { fields: Record<string, string>; form: string | null } {
  const fields: Record<string, string> = {};
  let form: string | null = null;
  if (!body || typeof body !== 'object') return { fields, form };
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
  const formErrors = details?.formErrors as unknown;
  if (Array.isArray(formErrors) && formErrors.length) form = String(formErrors[0]);
  const errorsArr = b.errors;
  if (Array.isArray(errorsArr)) {
    for (const item of errorsArr) {
      if (!item || typeof item !== 'object') continue;
      const it = item as Record<string, unknown>;
      const path = Array.isArray(it.path) ? (it.path as unknown[]).join('.') : String(it.field ?? it.path ?? '');
      const msg = String(it.message ?? it.error ?? 'Invalid value');
      if (path) fields[path] = msg;
      else if (!form) form = msg;
    }
  }
  return { fields, form };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    let body: unknown = null;
    try {
      body = await response.json();
      const b = body as Record<string, unknown>;
      const err = b?.error as Record<string, unknown> | undefined;
      if (typeof err?.message === 'string') message = err.message;
      else if (typeof b?.message === 'string') message = String(b.message);
    } catch { /* non-JSON body */ }
    const { fields, form } = extractErrors(body);
    throw new ApiError(response.status, form ?? message, fields, form, body);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) =>
    request<T>(p, { method: 'POST', body: b ? JSON.stringify(b) : undefined }),
  patch: <T>(p: string, b?: unknown) =>
    request<T>(p, { method: 'PATCH', body: b ? JSON.stringify(b) : undefined }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};

export function getFieldError(errors: Record<string, string>, ...keys: string[]): string | null {
  for (const key of keys) if (errors[key]) return errors[key];
  return null;
}
