import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { setAuthToken } from '../src/services/api';
import { storage } from '../src/services/storage';
import { User } from '../src/types';
import { colors } from '../src/theme';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const token = await storage.getAuthToken();
      const userData = await storage.getUser();
      if (token && userData) {
        setAuthToken(token);
        setUser(userData as User);
      }
    } catch {
      // Ignore auth load errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (token: string, userData: User) => {
    setAuthToken(token);
    await storage.saveAuth(token, userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    await storage.clearAuth();
    setUser(null);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="song/[id]"
          options={{
            title: '',
            headerBackTitle: 'Nyuma',
            headerTransparent: false,
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Ingia',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Jisajili',
            presentation: 'modal',
          }}
        />
      </Stack>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
