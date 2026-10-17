import axios from 'axios';

// Keep the login token under one key so every API request can find the same session.
const TOKEN_KEY = 'tms_token';

// Read or update the token in browser storage. Passing null clears the session.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

// Create one shared Axios client so pages use the same API prefix and interceptors.
const api = axios.create({ baseURL: '/api' });

// Runs before each request. Authenticated endpoints receive the token as a Bearer credential.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle failed responses globally. A 401 means the session is no longer accepted,
// so clear it and notify the app; login/setup are excluded because they can return
// 401 as part of their normal authentication flow.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/setup')) {
      setToken(null);
      window.dispatchEvent(new Event('tms:logout'));
    }
    return Promise.reject(err);
  }
);

// Choose the most useful message available: the server's message, a connection
// hint when no response arrived, or the caller-provided fallback for other errors.
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Is the API running?' : fallback);

export default api;
