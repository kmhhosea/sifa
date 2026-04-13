import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { authApi } from '../../src/services/api';
import { useAuthContext } from '../_layout';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Kosa', 'Tafadhali jaza barua pepe na nenosiri');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login(email.trim(), password);
      await login(result.token, result.user);
      router.back();
    } catch (error) {
      Alert.alert(
        'Imeshindikana kuingia',
        error instanceof Error ? error.message : 'Barua pepe au nenosiri si sahihi'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="musical-notes" size={48} color={colors.accent} />
          </View>
          <Text style={styles.logoText}>Sifa</Text>
          <Text style={styles.subtitle}>Nyimbo za Ibada</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Barua Pepe</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="mfano@email.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nenosiri</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Nenosiri lako"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Inaingia...' : 'Ingia'}
            </Text>
          </TouchableOpacity>

          {/* Demo credentials hint */}
          <View style={styles.demoHint}>
            <Ionicons name="information-circle" size={16} color={colors.info} />
            <Text style={styles.demoHintText}>
              Demo: demo@sifa.app / user123
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Huna akaunti?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.footerLink}> Jisajili</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={() => router.back()}>
          <Text style={styles.guestButtonText}>Endelea kama mgeni</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    ...typography.h1,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  demoHintText: {
    ...typography.caption,
    color: colors.info,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  guestButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  guestButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
