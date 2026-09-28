const PROCUREMENT_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api/v1';
const VENDOR_API = import.meta.env.VITE_VENDOR_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiErrorDetails {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  allMessages(): string[] {
    const out: string[] = [];
    if (this.details?.formErrors) out.push(...this.details.formErrors);
    if (this.details?.fieldErrors) {
      for (const [field, messages] of Object.entries(this.details.fieldErrors)) {
        for (const m of messages) out.push(`${humanize(field)}: ${m}`);
      }
    }
    return out;
  }
}

function humanize(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    let details: ApiErrorDetails | undefined;
    try {
      const body = await response.json();
      if (body?.error?.message) message = body.error.message;
      if (body?.error?.details) details = body.error.details;
    } catch {}
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// Named exports used by procurement.ts and vendor.ts in this frontend
export const procurementRequest = <T>(path: string, options?: RequestInit) =>
  request<T>(PROCUREMENT_API, path, options);

export const vendorRequest = <T>(path: string, options?: RequestInit) =>
  request<T>(VENDOR_API, path, options);

// Generic api object (matches the pattern used by the other frontends)
export const api = {
  get: <T>(path: string) => procurementRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    procurementRequest<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    procurementRequest<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => procurementRequest<T>(path, { method: 'DELETE' }),
};
