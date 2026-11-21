"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name?: string | null;
  role: 'customer' | 'admin';
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  order_counts?: {
    total: number;
    active: number;
    completed: number;
  };
}

export interface SessionTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
  }) => Promise<{ user: UserProfile; requiresVerification: boolean; message: string }>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (password: string, resetToken?: string) => Promise<string>;
  demoLogin: (role: 'customer' | 'admin') => Promise<UserProfile>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'digivio_token';
const USER_KEY = 'digivio_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to parse cached auth state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (authToken: string, authUser: UserProfile) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return null;

    try {
      const profile = await api.get<UserProfile>('/api/me', { token: currentToken });
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    try {
      const res = await api.post<{
        user: UserProfile;
        tokens: SessionTokens;
      }>('/api/auth/login', { email, password });

      saveSession(res.tokens.access_token, res.user);
      return res.user;
    } catch (err: any) {
      throw err;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
  }) => {
    try {
      const res = await api.post<{
        user: UserProfile;
        session?: SessionTokens | null;
        requiresEmailVerification?: boolean;
        message?: string;
      }>('/api/auth/register', data);

      if (res.session?.access_token) {
        saveSession(res.session.access_token, res.user);
      }

      return {
        user: res.user,
        requiresVerification: !!res.requiresEmailVerification,
        message: res.message || 'Account created successfully!',
      };
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    try {
      if (currentToken) {
        await api.post('/api/auth/logout', {}, { token: currentToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      clearSession();
    }
  };

  const resendVerification = async (email: string): Promise<string> => {
    const res = await api.post<{ message: string }>('/api/auth/resend-verification', { email });
    return res.message || 'Verification email has been sent. Please check your inbox.';
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
    return res.message || 'If an account exists, a reset link has been dispatched.';
  };

  const resetPassword = async (password: string, resetToken?: string): Promise<string> => {
    const effectiveToken = resetToken || token || localStorage.getItem(TOKEN_KEY);
    if (!effectiveToken) {
      throw new ApiError('Reset token missing or expired', 'UNAUTHORIZED', 400);
    }
    const res = await api.post<{ message: string }>(
      '/api/auth/reset-password',
      { password },
      { token: effectiveToken }
    );
    return res.message || 'Password successfully reset.';
  };

  // Built-in Demo quick login matching backend mock tokens in auth.middleware.ts
  const demoLogin = async (role: 'customer' | 'admin'): Promise<UserProfile> => {
    const demoToken =
      role === 'admin' ? 'test-admin-token' : 'test-customer-token';

    const demoUser: UserProfile =
      role === 'admin'
        ? {
            id: '99999999-8888-7777-6666-555555555555',
            email: 'admin@digitalheroes.print',
            full_name: 'System Administrator',
            role: 'admin',
          }
        : {
            id: '11111111-2222-3333-4444-555555555555',
            email: 'customer@test.com',
            full_name: 'Test Customer',
            company_name: 'DigiVio Demo Corp',
            role: 'customer',
          };

    saveSession(demoToken, demoUser);
    return demoUser;
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    resendVerification,
    forgotPassword,
    resetPassword,
    demoLogin,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
