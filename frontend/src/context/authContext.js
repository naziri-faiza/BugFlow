import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const TOKEN_STORAGE_KEY = 'bugflow_token';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
