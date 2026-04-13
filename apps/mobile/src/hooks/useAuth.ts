import { useState, useEffect, useCallback } from 'react';
import { authApi, setAuthToken } from '../services/api';
import { storage } from '../services/storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await storage.getAuthToken();
      const userData = await storage.getUser();
      if (token && userData) {
        setAuthToken(token);
        setState({
          user: userData as User,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAuthToken(result.token);
    await storage.saveAuth(result.token, result.user);
    setState({
      user: result.user,
      isLoading: false,
      isAuthenticated: true,
    });
    return result.user;
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await authApi.register(email, password, displayName);
    setAuthToken(result.token);
    await storage.saveAuth(result.token, result.user);
    setState({
      user: result.user,
      isLoading: false,
      isAuthenticated: true,
    });
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    await storage.clearAuth();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const continueAsGuest = useCallback(() => {
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    continueAsGuest,
  };
}
