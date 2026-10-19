const CORE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function coreFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${CORE_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', 
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}