import { createContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'book_app_auth';

const getInitialAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, role: null, user: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token ?? null,
      role: parsed.role ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { token: null, role: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getInitialAuth);

  const setSession = ({ token, role, user }) => {
    const next = {
      token: token ?? null,
      role: role ?? null,
      user: user ?? null,
    };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    const next = { token: null, role: null, user: null };
    setAuth(next);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token: auth.token,
      role: auth.role,
      user: auth.user,
      isAuthenticated: Boolean(auth.token),
      setSession,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
