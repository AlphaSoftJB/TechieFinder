import axios from 'axios';

// Expo exposes env vars prefixed EXPO_PUBLIC_ to client code automatically.
// - Android emulator can't reach the host's "localhost" -- use 10.0.2.2 instead.
// - iOS simulator can use localhost directly.
// - A physical device needs your machine's LAN IP (e.g. http://192.168.1.20:8080/api).
// Override any of these by setting EXPO_PUBLIC_API_URL before running `expo start`.
const DEFAULT_API_URL = 'http://localhost:8080/api';
const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
});

// Uploaded-file endpoints (portfolio photos, certificates) return paths like
// "/uploads/portfolio/xyz.jpg" relative to the backend's origin, not "/api" --
// this strips the "/api" suffix so screens can build a full image URL.
export const apiOrigin = apiUrl.replace(/\/api\/?$/, '');

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

export function apiErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || fallback;
}

export default api;
