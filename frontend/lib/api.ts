import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor: dynamic localhost baseURL fallback & Bearer token attachment
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // If the browser is on localhost/127.0.0.1, always communicate with localhost:5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      config.baseURL = 'http://localhost:5000';
    }

    const token = localStorage.getItem('campusplay_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global response interceptor: redirect to login on 401 (excluding session-check and logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/logout');

    if (typeof window !== 'undefined' && status === 401 && !isAuthEndpoint) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('campusplay_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
