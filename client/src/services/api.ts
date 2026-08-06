import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api';
import { API_BASE_URL } from '../config/network';


/**
 * Axios instance with JWT interceptors.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Request Interceptor: Attach JWT ───
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('assetchain_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle errors ───
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Token expired or invalid
      if (status === 401) {
        const hadToken = !!localStorage.getItem('assetchain_token');
        localStorage.removeItem('assetchain_token');
        localStorage.removeItem('assetchain_user');

        const publicPaths = ['/', '/marketplace', '/login', '/register', '/privacy', '/security'];
        const isPublicPath = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(`${p}/`));

        // Only redirect if user was previously logged in and is on a protected route
        if (hadToken && !isPublicPath) {
          window.location.href = '/login?expired=true';
        }
      }

      // Return the error data for handling by the caller
      return Promise.reject(data?.error || { code: 'UNKNOWN', message: 'An error occurred' });
    }

    // Network error
    if (error.request) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
      });
    }

    return Promise.reject({
      code: 'UNKNOWN',
      message: error.message || 'An unexpected error occurred',
    });
  }
);

export default api;
