import axios from 'axios';

// In dev, Vite's server proxy (vite.config.ts) forwards /api to the backend
// on :8080, so the relative default works with no extra setup. Set
// VITE_API_URL at build time to point a deployed build at a different host.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { message?: string } } };
  return axiosError?.response?.data?.message || fallback;
}

export default api;
