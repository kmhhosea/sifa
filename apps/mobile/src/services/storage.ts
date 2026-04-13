import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@sifa:auth_token',
  USER: '@sifa:user',
  OFFLINE_SONGS: '@sifa:offline_songs',
  FAVORITES_CACHE: '@sifa:favorites_cache',
  SETTINGS: '@sifa:settings',
  RECENT_SEARCHES: '@sifa:recent_searches',
} as const;

export const storage = {
  // Auth
  async saveAuth(token: string, user: object): Promise<void> {
    await AsyncStorage.multiSet([
      [KEYS.AUTH_TOKEN, token],
      [KEYS.USER, JSON.stringify(user)],
    ]);
  },

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  async getUser(): Promise<object | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.USER]);
  },

  // Offline songs
  async saveSongOffline(songId: string, songData: object): Promise<void> {
    const existing = await this.getOfflineSongs();
    existing[songId] = songData;
    await AsyncStorage.setItem(KEYS.OFFLINE_SONGS, JSON.stringify(existing));
  },

  async getOfflineSongs(): Promise<Record<string, object>> {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_SONGS);
    return data ? JSON.parse(data) : {};
  },

  async getOfflineSong(songId: string): Promise<object | null> {
    const songs = await this.getOfflineSongs();
    return songs[songId] || null;
  },

  async removeOfflineSong(songId: string): Promise<void> {
    const songs = await this.getOfflineSongs();
    delete songs[songId];
    await AsyncStorage.setItem(KEYS.OFFLINE_SONGS, JSON.stringify(songs));
  },

  async isDownloaded(songId: string): Promise<boolean> {
    const songs = await this.getOfflineSongs();
    return songId in songs;
  },

  // Favorites cache
  async cacheFavorites(songIds: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.FAVORITES_CACHE, JSON.stringify(songIds));
  },

  async getCachedFavorites(): Promise<string[]> {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES_CACHE);
    return data ? JSON.parse(data) : [];
  },

  // Recent searches
  async addRecentSearch(query: string): Promise<void> {
    const searches = await this.getRecentSearches();
    const updated = [query, ...searches.filter((s) => s !== query)].slice(0, 10);
    await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  },

  async getRecentSearches(): Promise<string[]> {
    const data = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
    return data ? JSON.parse(data) : [];
  },

  async clearRecentSearches(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
  },

  // Settings
  async saveSetting(key: string, value: string): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getSettings(): Promise<Record<string, string>> {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  },
};
