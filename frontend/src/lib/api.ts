export class ApiError extends Error {
  code: string;
  details?: any;
  status: number;

  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const storedToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('digivio_token') : null);

  if (storedToken) {
    requestHeaders['Authorization'] = `Bearer ${storedToken}`;
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.ok === false)) {
      const errorPayload = json?.error || {};
      const errorMessage =
        errorPayload.message ||
        json?.message ||
        `Request failed with status ${res.status}`;
      const errorCode = errorPayload.code || 'API_ERROR';
      throw new ApiError(errorMessage, errorCode, res.status, errorPayload.details);
    }

    return (json?.data !== undefined ? json.data : json) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or server unreachable
    if (err.message && err.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the backend server. Please check if the server is running on port 5000.',
        'NETWORK_ERROR',
        503
      );
    }
    throw new ApiError(err.message || 'An unexpected error occurred', 'CLIENT_ERROR', 500);
  }
}

export const api = {
  get: <T = any>(path: string, options?: RequestInit & { token?: string }) =>
    apiRequest<T>(path, { method: 'GET', ...options }),
  post: <T = any>(path: string, body?: any, options?: RequestInit & { token?: string }) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = any>(path: string, body?: any, options?: RequestInit & { token?: string }) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = any>(path: string, options?: RequestInit & { token?: string }) =>
    apiRequest<T>(path, { method: 'DELETE', ...options }),
};
