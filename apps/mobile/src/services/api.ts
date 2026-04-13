const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: import('../types').User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    request<{ user: import('../types').User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  getMe: () => request<{ user: import('../types').User }>('/auth/me'),
};

// Songs
export const songsApi = {
  getBooks: () =>
    request<{ books: import('../types').HymnBook[] }>('/songs/books'),

  getSongs: (params: {
    bookId?: string;
    category?: string;
    theme?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    return request<{
      songs: import('../types').Song[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/songs?${searchParams}`);
  },

  getSong: (id: string) =>
    request<{ song: import('../types').SongDetail }>(`/songs/${id}`),

  getSongByBookAndNumber: (shortName: string, number: number) =>
    request<{ song: import('../types').Song }>(`/songs/book/${shortName}/${number}`),

  getCategories: () =>
    request<{ categories: string[] }>('/songs/meta/categories'),

  getThemes: () =>
    request<{ themes: string[] }>('/songs/meta/themes'),
};

// Search
export const searchApi = {
  search: (params: {
    q: string;
    bookId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    return request<{
      songs: import('../types').Song[];
      query: string;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/search?${searchParams}`);
  },
};

// Favorites
export const favoritesApi = {
  list: (page = 1) =>
    request<{
      favorites: import('../types').Favorite[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/favorites?page=${page}`),

  toggle: (songId: string) =>
    request<{ isFavorite: boolean; message: string }>(`/favorites/${songId}`, {
      method: 'POST',
    }),
};

// Playlists
export const playlistsApi = {
  list: () =>
    request<{ playlists: import('../types').Playlist[] }>('/playlists'),

  create: (data: { name: string; description?: string }) =>
    request<{ playlist: import('../types').Playlist }>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    request<{ playlist: import('../types').Playlist }>(`/playlists/${id}`),

  addItem: (playlistId: string, songId: string) =>
    request(`/playlists/${playlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    }),

  delete: (id: string) =>
    request(`/playlists/${id}`, { method: 'DELETE' }),
};
