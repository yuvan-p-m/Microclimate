/**
 * Generic API Fetch Utility with robust error formatting.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
      `Unable to connect to the weather intelligence backend at ${API_BASE_URL}. (${errorMsg})`,
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
        detailMessage = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
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
      throw new ApiError(detailMessage || `Resource not found at ${endpoint}`, 404, detailMessage);
    } else if (response.status === 400) {
      throw new ApiError(detailMessage || `Bad request to ${endpoint}`, 400, detailMessage);
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
    throw new ApiError(`The backend returned an unexpected forecast response. (${errorMsg})`, response.status);
  }
}
