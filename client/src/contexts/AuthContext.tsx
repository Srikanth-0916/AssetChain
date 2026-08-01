import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, RegisterData, LoginData } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  loginWithWallet: (walletAddress: string, signature: string, role?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'assetchain_token';
const REFRESH_TOKEN_KEY = 'assetchain_refresh_token';
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

  // Validate session / Refresh Token on mount
  useEffect(() => {
    async function validateSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        if (storedToken) {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        } else if (storedRefreshToken) {
          // Token missing/expired — attempt refresh using refresh token
          const res = await authService.refreshToken(storedRefreshToken);
          setUser(res.user);
          setToken(res.token);
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          if (res.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
          }
        }
      } catch {
        // If current token failed, attempt refresh token fallback before clearing session
        if (storedRefreshToken && storedToken) {
          try {
            const res = await authService.refreshToken(storedRefreshToken);
            setUser(res.user);
            setToken(res.token);
            localStorage.setItem(TOKEN_KEY, res.token);
            localStorage.setItem(USER_KEY, JSON.stringify(res.user));
            if (res.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
            }
            setIsLoading(false);
            return;
          } catch {}
        }
        // Both failed — clear session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const result = await authService.login(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
  }, []);

  const loginWithWallet = useCallback(async (walletAddress: string, signature: string, role: string = 'investor') => {
    const result = await authService.loginWithWallet(walletAddress, signature, role);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await authService.register(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await authService.logout(currentRefreshToken || undefined);
    } catch {
      // Ignore logout API errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
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
        loginWithWallet,
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
