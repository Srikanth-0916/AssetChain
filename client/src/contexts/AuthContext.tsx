import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, RegisterData, LoginData } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'assetchain_token';
const USER_KEY = 'assetchain_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    async function validateSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } catch {
        // Token invalid — clear session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, [token]);

  const login = useCallback(async (data: LoginData) => {
    const result = await authService.login(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await authService.register(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
