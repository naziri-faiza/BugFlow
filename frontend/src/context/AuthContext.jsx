import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../api/auth.js';
import { AuthContext, TOKEN_STORAGE_KEY } from './authContext.js';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  // Validate stored token and hydrate user on initial load
  useEffect(() => {
    let isMounted = true;

    async function hydrateAuth() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getCurrentUser();
        if (isMounted) {
          if (data && data.success && data.user) {
            setUser(data.user);
          } else {
            logout();
          }
        }
      } catch (err) {
        if (isMounted) {
          // If token is invalid or expired (401) or user not found, clear storage
          if (err.response?.status === 401 || err.response?.status === 404) {
            logout();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
