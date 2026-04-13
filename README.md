# Sifa — Christian Hymn Learning & Worship App

**Sifa** (Swahili for "Praise") is a mobile app for learning, listening to, practicing, and singing Christian hymns from **Tumwabudu Mungu Wetu** (TMW) and **Tenzi za Rohoni** (TZR).

Built with React Native (Expo), Express, TypeScript, and Prisma.

## Features (Phase 1)

- Browse and search songs from both hymn books (TMW: 440+ songs, TZR: 144+ songs)
- Full song detail with lyrics, metadata, key, category, and theme
- Search by song number, title, lyric phrase, theme, or book
- Filter by book, category, mood, and service type
- Favorite songs (requires account)
- Offline lyrics storage
- User authentication (register, login, guest mode)
- Beautiful, calm, spiritually respectful UI
- Adjustable font size for lyrics
- Share songs
- Download lyrics for offline use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo + TypeScript |
| Backend API | Express + TypeScript |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Validation | Zod |
| Offline Storage | AsyncStorage |

## Project Structure

```
sifa/
├── apps/
│   ├── backend/           # Express API server
│   │   ├── prisma/        # Database schema & seeds
│   │   └── src/           # Server source code
│   │       ├── routes/    # API route handlers
│   │       ├── middleware/ # Auth & error handling
│   │       └── utils/     # JWT helpers
│   └── mobile/            # Expo React Native app
│       ├── app/           # Expo Router screens
│       │   ├── (tabs)/    # Tab navigation screens
│       │   ├── (auth)/    # Auth screens
│       │   └── song/      # Song detail screen
│       └── src/           # App source code
│           ├── components/ # Reusable UI components
│           ├── hooks/     # Custom React hooks
│           ├── services/  # API client & storage
│           ├── theme/     # Colors, typography, spacing
│           └── types/     # TypeScript type definitions
├── packages/
│   └── shared/            # Shared types (future use)
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Backend Setup

```bash
cd apps/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client & create database
npx prisma generate
npx prisma db push

# Seed the database with hymn data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

The API will be available at `http://localhost:8000`.

### Mobile App Setup

```bash
cd apps/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` for web.

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (auth required) |

### Songs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs/books` | List all hymn books |
| GET | `/api/songs` | List songs (with filtering & pagination) |
| GET | `/api/songs/:id` | Get song detail |
| GET | `/api/songs/book/:shortName/:number` | Get song by book + number |
| GET | `/api/songs/meta/categories` | List all categories |
| GET | `/api/songs/meta/themes` | List all themes |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=...` | Full-text search across songs |

### Favorites (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | List user's favorites |
| POST | `/api/favorites/:songId` | Toggle favorite |

### Playlists (auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playlists` | List playlists |
| POST | `/api/playlists` | Create playlist |
| GET | `/api/playlists/:id` | Get playlist with items |
| POST | `/api/playlists/:id/items` | Add song to playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@sifa.app | admin123 | Admin |
| demo@sifa.app | user123 | User |

## Database Schema

The database includes tables for:
- **Users** — authentication and profiles
- **Hymn Books** — TMW and TZR catalogs
- **Songs** — full lyrics, metadata, categories, themes
- **Favorites** — user's favorite songs
- **Downloads** — offline content tracking
- **Playlists** — worship service plans and custom playlists
- **Generation Jobs** — AI audio/video generation queue
- **Generated Audio/Video** — saved generated content
- **Reference Sources** — online melody references
- **Audit Logs** — admin activity tracking

## Roadmap

### Phase 2
- Online reference search integration
- AI audio generation settings UI
- Generation job queue
- Saved versions per song

### Phase 3
- Video generation
- Sing-along mode with auto-scrolling lyrics
- Service playlist builder
- Admin web dashboard

### Phase 4
- Performance optimization
- Analytics dashboard
- Multilingual support (Swahili/English)
- Community contributions

## License

Private — All rights reserved.
