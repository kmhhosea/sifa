import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { SongCard, EmptyState, LoadingSpinner } from '../../src/components';
import { favoritesApi } from '../../src/services/api';
import { useAuthContext } from '../_layout';
import { Favorite, Song } from '../../src/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadFavorites();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await favoritesApi.list();
      setFavorites(res.favorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (song: Song) => {
    try {
      await favoritesApi.toggle(song.id);
      setFavorites((prev) => prev.filter((f) => f.song.id !== song.id));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const navigateToSong = (song: Song) => {
    router.push(`/song/${song.id}`);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <Ionicons name="heart" size={64} color={colors.textLight} />
        <Text style={styles.authTitle}>Vipendwa Vyako</Text>
        <Text style={styles.authMessage}>
          Ingia ili kuhifadhi nyimbo unazozipenda
        </Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.authButtonText}>Ingia</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Inapakia vipendwa..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item.song}
            onPress={navigateToSong}
            onFavoritePress={handleToggleFavorite}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Hakuna vipendwa bado"
            message="Bonyeza moyo kwenye wimbo wowote ili kuuongeza hapa"
          />
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingTop: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  authMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  authButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  authButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});
