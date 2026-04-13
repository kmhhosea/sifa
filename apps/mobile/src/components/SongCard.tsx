import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  onPress: (song: Song) => void;
  onFavoritePress?: (song: Song) => void;
  showBook?: boolean;
}

export function SongCard({ song, onPress, onFavoritePress, showBook = true }: SongCardProps) {
  const bookColor = song.hymnBook.shortName === 'TMW' ? colors.tmw : colors.tzr;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
    >
      <View style={[styles.numberBadge, { backgroundColor: bookColor }]}>
        <Text style={styles.numberText}>{song.songNumber}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <View style={styles.metaRow}>
          {showBook && (
            <View style={[styles.bookBadge, { backgroundColor: `${bookColor}15` }]}>
              <Text style={[styles.bookText, { color: bookColor }]}>
                {song.hymnBook.shortName}
              </Text>
            </View>
          )}
          {song.category && (
            <Text style={styles.category}>{song.category}</Text>
          )}
          {song.key && (
            <Text style={styles.keyText}>Key: {song.key}</Text>
          )}
        </View>
      </View>

      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onFavoritePress(song)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={song.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={song.isFavorite ? colors.favorite : colors.favoriteInactive}
          />
        </TouchableOpacity>
      )}

      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberText: {
    ...typography.songNumber,
    color: colors.textOnPrimary,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  bookText: {
    ...typography.caption,
    fontWeight: '600',
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  keyText: {
    ...typography.caption,
    color: colors.textLight,
  },
  favoriteButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
});
