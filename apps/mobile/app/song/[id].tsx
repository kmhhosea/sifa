import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { LoadingSpinner } from '../../src/components';
import { songsApi, favoritesApi } from '../../src/services/api';
import { storage } from '../../src/services/storage';
import { useAuthContext } from '../_layout';
import { SongDetail } from '../../src/types';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthContext();

  const [song, setSong] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    loadSong();
  }, [id]);

  const loadSong = async () => {
    if (!id) return;
    try {
      const res = await songsApi.getSong(id);
      setSong(res.song);
      setIsFavorite(res.song.isFavorite || false);

      navigation.setOptions({
        title: `${res.song.hymnBook.shortName} #${res.song.songNumber}`,
      });

      const downloaded = await storage.isDownloaded(id);
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error('Failed to load song:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !song) {
      Alert.alert('Ingia', 'Ingia ili kuhifadhi vipendwa');
      return;
    }
    try {
      const res = await favoritesApi.toggle(song.id);
      setIsFavorite(res.isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDownload = async () => {
    if (!song) return;
    if (isDownloaded) {
      await storage.removeOfflineSong(song.id);
      setIsDownloaded(false);
    } else {
      await storage.saveSongOffline(song.id, song);
      setIsDownloaded(true);
      Alert.alert('Imehifadhiwa', 'Maneno ya wimbo yamehifadhiwa kwa matumizi ya nje ya mtandao');
    }
  };

  const handleShare = async () => {
    if (!song) return;
    try {
      await Share.share({
        message: `${song.title} - ${song.hymnBook.name} #${song.songNumber}\n\n${song.lyrics}`,
      });
    } catch {
      // User cancelled
    }
  };

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => Math.max(14, Math.min(32, prev + delta)));
  };

  if (loading || !song) {
    return <LoadingSpinner message="Inapakia wimbo..." />;
  }

  const bookColor = song.hymnBook.shortName === 'TMW' ? colors.tmw : colors.tzr;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={[styles.headerCard, { borderTopColor: bookColor }]}>
        <View style={styles.headerTop}>
          <View style={[styles.numberBadge, { backgroundColor: bookColor }]}>
            <Text style={styles.numberText}>#{song.songNumber}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? colors.favorite : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
              <Ionicons
                name={isDownloaded ? 'checkmark-circle' : 'download-outline'}
                size={24}
                color={isDownloaded ? colors.success : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>{song.title}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.bookBadge, { backgroundColor: `${bookColor}15` }]}>
            <Text style={[styles.bookBadgeText, { color: bookColor }]}>
              {song.hymnBook.name}
            </Text>
          </View>
        </View>

        {/* Song Metadata */}
        <View style={styles.metaGrid}>
          {song.category && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag" size={14} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>Kategoria:</Text>
              <Text style={styles.metaValue}>{song.category}</Text>
            </View>
          )}
          {song.key && (
            <View style={styles.metaItem}>
              <Ionicons name="musical-note" size={14} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>Ufunguo:</Text>
              <Text style={styles.metaValue}>{song.key}</Text>
            </View>
          )}
          {song.theme && (
            <View style={styles.metaItem}>
              <Ionicons name="color-palette" size={14} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>Mada:</Text>
              <Text style={styles.metaValue}>{song.theme}</Text>
            </View>
          )}
          {song.verseCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="list" size={14} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>Beti:</Text>
              <Text style={styles.metaValue}>{song.verseCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Font Size Controls */}
      <View style={styles.fontControls}>
        <Text style={styles.fontControlLabel}>Ukubwa wa maandishi</Text>
        <View style={styles.fontControlButtons}>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => adjustFontSize(-2)}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>{fontSize}</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => adjustFontSize(2)}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lyrics */}
      <View style={styles.lyricsCard}>
        <Text style={[styles.lyrics, { fontSize, lineHeight: fontSize * 1.7 }]}>
          {song.lyrics}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: bookColor }]}>
          <Ionicons name="musical-notes" size={20} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>Tengeneza Muziki</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="videocam" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Tengeneza Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="mic" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Imba Pamoja</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="fitness" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Zoezi la Kwaya</Text>
        </TouchableOpacity>
      </View>

      {/* Generated Versions */}
      {song.generatedAudios.length > 0 && (
        <View style={styles.versionsSection}>
          <Text style={styles.sectionTitle}>Toleo zilizotengenezwa</Text>
          {song.generatedAudios.map((audio) => (
            <View key={audio.id} style={styles.versionItem}>
              <Ionicons name="play-circle" size={36} color={colors.primary} />
              <View style={styles.versionInfo}>
                <Text style={styles.versionLabel}>{audio.label}</Text>
                <Text style={styles.versionMeta}>
                  {audio.format.toUpperCase()} {audio.duration ? `• ${Math.floor(audio.duration / 60)}:${String(audio.duration % 60).padStart(2, '0')}` : ''}
                </Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="download-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  numberBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  numberText: {
    ...typography.songNumber,
    color: colors.textOnPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bookBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bookBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  fontControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  fontControlLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fontControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontButtonText: {
    ...typography.label,
    color: colors.text,
  },
  fontSizeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    minWidth: 24,
    textAlign: 'center',
  },
  lyricsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lyrics: {
    color: colors.text,
    fontFamily: undefined,
  },
  actionsSection: {
    margin: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  versionsSection: {
    margin: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  versionInfo: {
    flex: 1,
  },
  versionLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  versionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});
