import axios from 'axios';

// Single public origin for the backend; the REST client appends `/api` itself.
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Global response interceptor: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthProbe = url.includes('/auth/me') || url.includes('/auth/logout');
    if (typeof window !== 'undefined' && status === 401 && !isAuthProbe) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
