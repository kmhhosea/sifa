import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuthContext } from '../_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();

  const menuItems = [
    { icon: 'language' as const, label: 'Lugha', value: 'Kiswahili' },
    { icon: 'moon' as const, label: 'Mandhari meusi', value: 'Imezimwa' },
    { icon: 'text' as const, label: 'Ukubwa wa maandishi', value: 'Kawaida' },
    { icon: 'notifications' as const, label: 'Arifa', value: '' },
    { icon: 'information-circle' as const, label: 'Kuhusu Sifa', value: 'v1.0.0' },
    { icon: 'help-circle' as const, label: 'Msaada', value: '' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      {isAuthenticated && user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'admin' ? 'Msimamizi' : user.role === 'choir_leader' ? 'Kiongozi wa Kwaya' : 'Mtumiaji'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textLight} />
          <Text style={styles.guestTitle}>Mgeni</Text>
          <Text style={styles.guestMessage}>
            Ingia ili kuhifadhi vipendwa na mipangilio yako
          </Text>
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Ingia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.registerButtonText}>Jisajili</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Mipangilio</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.value ? (
                <Text style={styles.menuItemValue}>{item.value}</Text>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Toka</Text>
        </TouchableOpacity>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Sifa v1.0.0</Text>
        <Text style={styles.appInfoText}>Nyimbo za Ibada</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.textOnPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    ...typography.h3,
    color: colors.text,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  roleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  guestCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  guestTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
  guestMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  authButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  loginButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  registerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  registerButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  menuSection: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuSectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuItemValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appInfoText: {
    ...typography.caption,
    color: colors.textLight,
  },
});
