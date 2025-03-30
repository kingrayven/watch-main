import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

// Configure axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  withCredentials: true,
});

// Auth token helpers
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const clearToken = (): void => localStorage.removeItem('token');

// Add request interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterData) => Promise<void>;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<{
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
  }>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAuthError = useCallback((error: unknown, fallbackMessage = 'Authentication failed') => {
    let errorMessage = fallbackMessage;
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    updateState({
      loading: false,
      error: errorMessage,
    });

    return errorMessage;
  }, [updateState]);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) {
        updateState({ isAuthenticated: false, user: null, loading: false });
        return false;
      }

      const { data } = await api.get<User>('/api/users/me');
      updateState({ isAuthenticated: true, user: data, loading: false });
      return true;
    } catch (error) {
      clearToken();
      handleAuthError(error, 'Session expired');
      updateState({ isAuthenticated: false, user: null, loading: false });
      return false;
    }
  }, [updateState, handleAuthError]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    updateState({ loading: true, error: null });
    try {
      const response = await api.post<{ token: string }>('/api/auth/register', userData);
      setToken(response.data.token);
      await checkAuth();
    } catch (error) {
      const message = handleAuthError(error, 'Registration failed');
      throw new Error(message);
    }
  }, [checkAuth, handleAuthError, updateState]);

  const login = useCallback(async ({ email, password }: LoginData): Promise<void> => {
    updateState({ loading: true, error: null });
    try {
      const response = await api.post<{ token: string }>('/api/auth/login', { email, password });
      setToken(response.data.token);
      await checkAuth();
    } catch (error) {
      const message = handleAuthError(error, 'Login failed');
      throw new Error(message);
    }
  }, [checkAuth, handleAuthError, updateState]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
      clearToken();
      updateState({ isAuthenticated: false, user: null, loading: false });
    } catch (error) {
      handleAuthError(error, 'Logout failed');
    }
  }, [handleAuthError, updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const value: AuthContextType = {
    ...state,
    register,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};