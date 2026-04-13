import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  color?: string;
}

export function FilterChip({ label, isActive, onPress, color }: FilterChipProps) {
  const activeColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          isActive && { color: colors.textOnPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
