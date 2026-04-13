export interface HymnBook {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  language: string;
  totalSongs: number;
  coverImageUrl: string | null;
  _count?: { songs: number };
}

export interface Song {
  id: string;
  hymnBookId: string;
  songNumber: number;
  title: string;
  lyrics: string;
  category: string | null;
  theme: string | null;
  worshipContext: string | null;
  language: string;
  key: string | null;
  timeSignature: string | null;
  hasChorus: boolean;
  verseCount: number;
  hymnBook: Pick<HymnBook, 'id' | 'name' | 'shortName'>;
  tags: { tag: string }[];
  isFavorite?: boolean;
  _count?: {
    favorites: number;
    generatedAudios: number;
    generatedVideos: number;
  };
}

export interface SongDetail extends Song {
  referenceSources: ReferenceSrc[];
  generatedAudios: GeneratedAudio[];
  generatedVideos: GeneratedVideo[];
}

export interface ReferenceSrc {
  id: string;
  sourceType: string;
  sourceUrl: string;
  title: string | null;
  confidenceScore: number;
  previewUrl: string | null;
}

export interface GeneratedAudio {
  id: string;
  label: string;
  fileUrl: string | null;
  duration: number | null;
  format: string;
  settings: string;
  createdAt: string;
}

export interface GeneratedVideo {
  id: string;
  label: string;
  fileUrl: string | null;
  duration: number | null;
  format: string;
  videoType: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  language: string;
  avatarUrl: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  isServicePlan: boolean;
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: T[] | { page: number; limit: number; total: number; totalPages: number };
}

export interface Favorite {
  id: string;
  song: Song;
  createdAt: string;
}
