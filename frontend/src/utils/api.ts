import { useAppStore } from '../store/useAppStore';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<any> {
  const store = useAppStore.getState();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
  
  const headers = new Headers(options.headers || {});
  if (store.token) {
    headers.set('Authorization', `Bearer ${store.token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly refresh cookie rotation
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // Handle 401 token refresh rotation
    if (response.status === 401 && !isRetry && store.token) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh token invalid');
          }

          const refreshData = await refreshRes.json();
          useAppStore.setState({ token: refreshData.access_token });
          isRefreshing = false;
          onRefreshed(refreshData.access_token);
        } catch (refreshErr) {
          isRefreshing = false;
          // Refresh failed - log out user
          useAppStore.setState({ user: null, token: null, activeHouseholdId: null });
          window.location.href = '/login';
          throw new ApiError(401, 'Session expired. Please log in again.');
        }
      }

      // Wait for refresh to complete, then retry request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          resolve(apiRequest(endpoint, { ...options, headers }, true));
        });
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || response.statusText || 'An error occurred during API request',
        errorData,
      );
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, (error as Error).message || 'Network connection failed');
  }
}
