import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { EmptyState } from '../../src/components';
import { storage } from '../../src/services/storage';
import { Song } from '../../src/types';

export default function DownloadsScreen() {
  const router = useRouter();
  const [offlineSongs, setOfflineSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [])
  );

  const loadDownloads = async () => {
    try {
      const songs = await storage.getOfflineSongs();
      setOfflineSongs(Object.values(songs) as Song[]);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDownload = async (song: Song) => {
    await storage.removeOfflineSong(song.id);
    loadDownloads();
  };

  const navigateToSong = (song: Song) => {
    router.push(`/song/${song.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Storage Info */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Ionicons name="cloud-download" size={24} color={colors.primary} />
          <Text style={styles.storageTitle}>Hifadhi ya Nje ya Mtandao</Text>
        </View>
        <Text style={styles.storageInfo}>
          {offlineSongs.length} nyimbo zimehifadhiwa
        </Text>
        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageBarFill,
              { width: `${Math.min((offlineSongs.length / 100) * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={offlineSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.downloadItem}
            onPress={() => navigateToSong(item)}
            activeOpacity={0.7}
          >
            <View style={styles.downloadContent}>
              <Text style={styles.downloadTitle} numberOfLines={1}>
                {item.songNumber}. {item.title}
              </Text>
              <Text style={styles.downloadMeta}>
                {item.hymnBook?.shortName || 'Wimbo'} • Maneno yamehifadhiwa
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveDownload(item)}
              style={styles.removeButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="download-outline"
              title="Hakuna vilivyopakuliwa"
              message="Pakua nyimbo ili uzisikilize bila mtandao"
            />
          ) : null
        }
        contentContainerStyle={offlineSongs.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  storageCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  storageTitle: {
    ...typography.h4,
    color: colors.text,
  },
  storageInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  storageBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  list: {
    paddingTop: spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  downloadContent: {
    flex: 1,
  },
  downloadTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  downloadMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.sm,
  },
});
