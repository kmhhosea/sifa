import { Router } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const songRoutes = Router();

// List all hymn books
songRoutes.get('/books', async (_req, res) => {
  const books = await prisma.hymnBook.findMany({
    include: {
      _count: { select: { songs: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json({ books });
});

// List songs with filtering and pagination
songRoutes.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const {
    bookId,
    category,
    theme,
    language,
    page = '1',
    limit = '20',
    sort = 'songNumber',
    order = 'asc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (bookId) where.hymnBookId = bookId;
  if (category) where.category = category;
  if (theme) where.theme = theme;
  if (language) where.language = language;

  const validSortFields = ['songNumber', 'title', 'createdAt'];
  const sortField = validSortFields.includes(sort as string) ? (sort as string) : 'songNumber';
  const sortOrder = order === 'desc' ? 'desc' : 'asc';

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: {
        hymnBook: { select: { id: true, name: true, shortName: true } },
        tags: { select: { tag: true } },
        _count: {
          select: {
            favorites: true,
            generatedAudios: true,
            generatedVideos: true,
          },
        },
        ...(req.userId
          ? {
              favorites: {
                where: { userId: req.userId },
                select: { id: true },
              },
            }
          : {}),
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.song.count({ where }),
  ]);

  const enrichedSongs = songs.map((song) => ({
    ...song,
    isFavorite: req.userId ? ((song as unknown as Record<string, unknown[]>).favorites?.length ?? 0) > 0 : false,
    favorites: undefined,
  }));

  res.json({
    songs: enrichedSongs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// Get single song with full details
songRoutes.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  const song = await prisma.song.findUnique({
    where: { id: req.params.id },
    include: {
      hymnBook: true,
      tags: { select: { tag: true } },
      referenceSources: {
        orderBy: { relevanceRank: 'asc' },
        take: 10,
      },
      generatedAudios: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      generatedVideos: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: { favorites: true },
      },
      ...(req.userId
        ? {
            favorites: {
              where: { userId: req.userId },
              select: { id: true },
            },
          }
        : {}),
    },
  });

  if (!song) {
    throw new AppError('Song not found', 404);
  }

  res.json({
    song: {
      ...song,
      isFavorite: req.userId ? ((song as unknown as Record<string, unknown[]>).favorites?.length ?? 0) > 0 : false,
      favorites: undefined,
    },
  });
});

// Get songs by hymn book and number
songRoutes.get('/book/:shortName/:number', async (req, res) => {
  const { shortName, number } = req.params;

  const book = await prisma.hymnBook.findUnique({
    where: { shortName: shortName.toUpperCase() },
  });

  if (!book) {
    throw new AppError('Hymn book not found', 404);
  }

  const song = await prisma.song.findUnique({
    where: {
      hymnBookId_songNumber: {
        hymnBookId: book.id,
        songNumber: parseInt(number, 10),
      },
    },
    include: {
      hymnBook: true,
      tags: { select: { tag: true } },
      _count: { select: { favorites: true } },
    },
  });

  if (!song) {
    throw new AppError('Song not found', 404);
  }

  res.json({ song });
});

// Get all categories
songRoutes.get('/meta/categories', async (_req, res) => {
  const categories = await prisma.song.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  res.json({
    categories: categories.map((c) => c.category).filter(Boolean),
  });
});

// Get all themes
songRoutes.get('/meta/themes', async (_req, res) => {
  const themes = await prisma.song.findMany({
    where: { theme: { not: null } },
    select: { theme: true },
    distinct: ['theme'],
    orderBy: { theme: 'asc' },
  });

  res.json({
    themes: themes.map((t) => t.theme).filter(Boolean),
  });
});
