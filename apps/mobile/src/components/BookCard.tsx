import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { HymnBook } from '../types';

interface BookCardProps {
  book: HymnBook;
  onPress: (book: HymnBook) => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  const bookColor = book.shortName === 'TMW' ? colors.tmw : colors.tzr;
  const songCount = book._count?.songs ?? book.totalSongs;

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: bookColor }]}
      onPress={() => onPress(book)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${bookColor}15` }]}>
        <Ionicons name="book" size={28} color={bookColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.name}
        </Text>
        <Text style={styles.subtitle}>
          {songCount} nyimbo
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
