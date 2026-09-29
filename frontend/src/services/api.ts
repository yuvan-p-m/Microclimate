/**
 * Generic API Fetch Utility with robust error formatting and URL normalization.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').trim();

export class ApiError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Normalizes base URL and endpoint paths to prevent duplicate prefixes (e.g. /api/v1/api/v1)
 * and trailing slash discrepancies.
 */
export function buildUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already contains /api/v1 and endpoint begins with /api/v1, strip it from endpoint
  if (base.endsWith('/api/v1') && path.startsWith('/api/v1/')) {
    return `${base}${path.substring('/api/v1'.length)}`;
  }

  // If base does not have /api/v1 and endpoint does not have /api/v1 (unless it's a root diagnostic endpoint)
  if (!base.endsWith('/api/v1') && !path.startsWith('/api/v1') && !path.startsWith('/health')) {
    return `${base}/api/v1${path}`;
  }

  return `${base}${path}`;
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildUrl(endpoint);
  
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new ApiError(
      `Unable to connect to the weather intelligence backend at ${url}. (${errorMsg})`,
      0
    );
  }

  if (!response.ok) {
    let detailMessage = '';
    try {
      const errorJson = await response.json();
      if (typeof errorJson?.detail === 'string') {
        detailMessage = errorJson.detail;
      } else if (Array.isArray(errorJson?.detail)) {
        detailMessage = errorJson.detail
          .map((d: { msg?: string; loc?: string[] }) => d.msg || JSON.stringify(d))
          .join(', ');
      } else if (errorJson?.detail) {
        detailMessage = JSON.stringify(errorJson.detail);
      }
    } catch {
      try {
        detailMessage = await response.text();
      } catch {
        detailMessage = response.statusText;
      }
    }

    if (response.status === 404) {
      throw new ApiError(detailMessage || `Resource not found at ${url}`, 404, detailMessage);
    } else if (response.status === 422) {
      throw new ApiError(detailMessage || `Validation error (422) for ${url}`, 422, detailMessage);
    } else if (response.status === 400) {
      throw new ApiError(detailMessage || `Bad request (400) to ${url}`, 400, detailMessage);
    } else {
      throw new ApiError(
        detailMessage || `Server Error (${response.status}): ${response.statusText}`,
        response.status,
        detailMessage
      );
    }
  }

  try {
    return await response.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new ApiError(`The backend returned an unexpected response format from ${url}. (${errorMsg})`, response.status);
  }
}

