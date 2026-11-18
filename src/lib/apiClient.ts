const CORE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

let activeRefreshPromise: Promise<boolean> | null = null;

async function silentRefreshSession(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function coreFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const url = `${CORE_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const isAuthPublicRoute =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/logout') ||
    endpoint.includes('/auth/register');

  if (response.status === 401 && !_isRetry && !isAuthPublicRoute) {
    const refreshed = await silentRefreshSession();
    if (refreshed) {
      return coreFetch<T>(endpoint, options, true);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.error || `HTTP error! status: ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return response.json();
}