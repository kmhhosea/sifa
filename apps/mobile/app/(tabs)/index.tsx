import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { SongCard, BookCard, LoadingSpinner } from '../../src/components';
import { songsApi } from '../../src/services/api';
import { HymnBook, Song } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<HymnBook[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksRes, songsRes] = await Promise.all([
        songsApi.getBooks(),
        songsApi.getSongs({ limit: 10, sort: 'songNumber', order: 'asc' }),
      ]);
      setBooks(booksRes.books);
      setRecentSongs(songsRes.songs);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToSong = (song: Song) => {
    router.push(`/song/${song.id}`);
  };

  const navigateToBook = (book: HymnBook) => {
    router.push(`/search?bookId=${book.id}&bookName=${encodeURIComponent(book.name)}`);
  };

  if (loading) {
    return <LoadingSpinner message="Inapakia..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Karibu,</Text>
          <Text style={styles.appName}>Sifa</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="musical-notes" size={32} color={colors.accent} />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={24} color={colors.tmw} />
          <Text style={styles.statNumber}>{books.length}</Text>
          <Text style={styles.statLabel}>Vitabu</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="musical-note" size={24} color={colors.tzr} />
          <Text style={styles.statNumber}>
            {books.reduce((sum, b) => sum + (b._count?.songs ?? b.totalSongs), 0)}
          </Text>
          <Text style={styles.statLabel}>Nyimbo</Text>
        </View>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={24} color={colors.accent} />
          <Text style={styles.statNumber}>Tafuta</Text>
          <Text style={styles.statLabel}>Nyimbo</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Verse Card */}
      <View style={styles.dailyCard}>
        <View style={styles.dailyCardHeader}>
          <Ionicons name="sunny" size={20} color={colors.accent} />
          <Text style={styles.dailyCardTitle}>Wimbo wa Leo</Text>
        </View>
        <Text style={styles.dailyVerse}>
          "Mimbeni Bwana wimbo mpya, mwimbieni Bwana, dunia yote."
        </Text>
        <Text style={styles.dailyRef}>— Zaburi 96:1</Text>
      </View>

      {/* Hymn Books */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vitabu vya Nyimbo</Text>
        {books.map((book) => (
          <BookCard key={book.id} book={book} onPress={navigateToBook} />
        ))}
      </View>

      {/* Featured Songs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nyimbo Maarufu</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.seeAll}>Ona zote</Text>
          </TouchableOpacity>
        </View>
        {recentSongs.map((song) => (
          <SongCard key={song.id} song={song} onPress={navigateToSong} />
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dailyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dailyCardTitle: {
    ...typography.label,
    color: colors.accentLight,
  },
  dailyVerse: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  dailyRef: {
    ...typography.caption,
    color: colors.textOnDark,
    textAlign: 'right',
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.label,
    color: colors.primary,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});
