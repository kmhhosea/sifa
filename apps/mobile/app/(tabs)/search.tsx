import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { SearchBar, SongCard, FilterChip, EmptyState, LoadingSpinner } from '../../src/components';
import { songsApi, searchApi } from '../../src/services/api';
import { Song, HymnBook } from '../../src/types';
import { storage } from '../../src/services/storage';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId?: string; bookName?: string }>();

  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [books, setBooks] = useState<HymnBook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | undefined>(params.bookId);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    setPage(1);
    loadSongs(true);
  }, [selectedBook, selectedCategory]);

  const loadFilters = async () => {
    try {
      const [booksRes, catsRes] = await Promise.all([
        songsApi.getBooks(),
        songsApi.getCategories(),
      ]);
      setBooks(booksRes.books);
      setCategories(catsRes.categories);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const loadRecentSearches = async () => {
    const searches = await storage.getRecentSearches();
    setRecentSearches(searches);
  };

  const loadSongs = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;

      if (query.trim()) {
        const res = await searchApi.search({
          q: query.trim(),
          bookId: selectedBook,
          category: selectedCategory,
          page: currentPage,
          limit: 20,
        });
        if (reset) {
          setSongs(res.songs);
        } else {
          setSongs((prev) => [...prev, ...res.songs]);
        }
        setTotalResults(res.pagination.total);
        setHasMore(currentPage < res.pagination.totalPages);
      } else {
        const res = await songsApi.getSongs({
          bookId: selectedBook,
          category: selectedCategory,
          page: currentPage,
          limit: 20,
        });
        if (reset) {
          setSongs(res.songs);
        } else {
          setSongs((prev) => [...prev, ...res.songs]);
        }
        setTotalResults(res.pagination.total);
        setHasMore(currentPage < res.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      storage.addRecentSearch(query.trim());
      loadRecentSearches();
    }
    setPage(1);
    loadSongs(true);
  }, [query, selectedBook, selectedCategory]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
      loadSongs(false);
    }
  };

  const navigateToSong = (song: Song) => {
    router.push(`/song/${song.id}`);
  };

  const renderHeader = () => (
    <View>
      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersRow}>
          <FilterChip
            label="Zote"
            isActive={!selectedBook}
            onPress={() => setSelectedBook(undefined)}
          />
          {books.map((book) => (
            <FilterChip
              key={book.id}
              label={book.shortName}
              isActive={selectedBook === book.id}
              onPress={() => setSelectedBook(selectedBook === book.id ? undefined : book.id)}
              color={book.shortName === 'TMW' ? colors.tmw : colors.tzr}
            />
          ))}
        </View>
      </ScrollView>

      {/* Category Chips */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <FilterChip
              label="Kategoria zote"
              isActive={!selectedCategory}
              onPress={() => setSelectedCategory(undefined)}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                isActive={selectedCategory === cat}
                onPress={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                color={colors.accent}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Results count */}
      {totalResults > 0 && (
        <Text style={styles.resultCount}>
          {totalResults} nyimbo {query.trim() ? `kwa "${query.trim()}"` : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSearch}
        onClear={() => {
          setQuery('');
          setPage(1);
          loadSongs(true);
        }}
        placeholder="Tafuta kwa namba, jina, au maneno..."
      />

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard song={item} onPress={navigateToSong} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <LoadingSpinner message="Inatafuta..." />
          ) : (
            <EmptyState
              icon="search"
              title="Hakuna matokeo"
              message="Jaribu maneno tofauti au ondoa vichujio"
            />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={songs.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersScroll: {
    paddingLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingRight: spacing.lg,
  },
  resultCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
});
