import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, RegisterData, LoginData } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User>;
  loginWithWallet: (walletAddress: string, signature: string, role?: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'assetchain_token';
const REFRESH_TOKEN_KEY = 'assetchain_refresh_token';
const USER_ID_KEY = 'assetchain_user_id';
const LEGACY_USER_KEY = 'assetchain_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start with user = null (do not trust stored profile objects)
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate session / Fetch current user profile directly from server GET /api/v1/auth/me
  useEffect(() => {
    async function validateSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      // Clean up legacy cached profile object if present
      localStorage.removeItem(LEGACY_USER_KEY);

      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        if (storedToken) {
          // Server is single source of truth
          const currentUser = await authService.getMe();
          setUser(currentUser);
          localStorage.setItem(USER_ID_KEY, currentUser.id);
        } else if (storedRefreshToken) {
          // Token missing/expired — attempt refresh using refresh token
          const res = await authService.refreshToken(storedRefreshToken);
          setUser(res.user);
          setToken(res.token);
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_ID_KEY, res.user.id);
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
            localStorage.setItem(USER_ID_KEY, res.user.id);
            if (res.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
            }
            setIsLoading(false);
            return;
          } catch {}
        }
        // Both failed — clear session completely
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(LEGACY_USER_KEY);
        localStorage.removeItem('assetchain_connected_wallet');
        sessionStorage.removeItem('assetchain_connected_wallet');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    validateSession();
  }, []);

  const login = useCallback(async (data: LoginData): Promise<User> => {
    const result = await authService.login(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_ID_KEY, result.user.id);
    localStorage.removeItem(LEGACY_USER_KEY);
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
    return result.user;
  }, []);

  const loginWithWallet = useCallback(async (walletAddress: string, signature: string, role: string = 'investor'): Promise<User> => {
    const result = await authService.loginWithWallet(walletAddress, signature, role);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_ID_KEY, result.user.id);
    localStorage.removeItem(LEGACY_USER_KEY);
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
    return result.user;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    const result = await authService.register(data);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_ID_KEY, result.user.id);
    localStorage.removeItem(LEGACY_USER_KEY);
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
    return result.user;
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
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      localStorage.removeItem('assetchain_connected_wallet');
      sessionStorage.removeItem('assetchain_connected_wallet');
      window.dispatchEvent(new Event('assetchain_logout'));
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
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
