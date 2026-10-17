import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getToken, setToken } from '../lib/api';

/**
 * AuthContext holds "who is logged in" for the whole app.
 * Any component can call useAuth() to read the current user or to log in/out,
 * without passing props down through every level.
 */
const AuthContext = createContext(null);

// Shortcut hook so components write `const { user } = useAuth()`
// instead of `useContext(AuthContext)` everywhere.
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // The logged-in staff member (null = nobody logged in)
  const [user, setUser] = useState(null);

  // True while we are checking a saved token with the server.
  // It starts as true only if a token exists in localStorage, so a visitor
  // with no token goes straight to the login page with no loading flash.
  const [loading, setLoading] = useState(!!getToken());

  // On first load: if a token was saved from a previous visit, ask the API
  // who it belongs to. This keeps the user logged in after a page refresh.
  useEffect(() => {
    if (!getToken()) return;
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setToken(null)) // token expired or invalid: discard it
      .finally(() => setLoading(false)); // either way, we're done checking
  }, []);

  // api.js fires a 'tms:logout' event when any request comes back 401
  // (session expired). Listening here clears the user, so Protected routes
  // in App.jsx send them back to the login page automatically.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('tms:logout', onLogout);
    // Cleanup: stop listening when the provider unmounts
    return () => window.removeEventListener('tms:logout', onLogout);
  }, []);

  // Shared by login and setup: both return { token, user } from the API.
  // Save the token (so refreshes and later requests stay authenticated)
  // and store the user in state (so the UI updates immediately).
  const finish = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
  }, []);

  // Log in an existing staff member. Throws if the credentials are wrong,
  // so the Login page can catch it and show a toast.
  const login = useCallback(
    async (email, password) => finish((await api.post('/auth/login', { email, password })).data),
    [finish]
  );

  // First-run only: creates the very first admin account, then logs them in.
  // The server rejects this once any staff member exists.
  const setup = useCallback(async (payload) => finish((await api.post('/auth/setup', payload)).data), [finish]);

  // Logging out is purely client-side: JWTs are stateless, so we just
  // forget the token and the user.
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Bundle everything the rest of the app can use. useMemo keeps the object
  // the same between renders unless something inside changed, so components
  // that read the context don't re-render needlessly.
  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin', // convenient flag for showing admin-only buttons
      login,
      setup,
      logout,
    }),
    [user, loading, login, setup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}