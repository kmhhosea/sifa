import { Router } from 'express';
import { prisma } from '../index';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const searchRoutes = Router();

// Full-text search across songs
searchRoutes.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const {
    q,
    bookId,
    category,
    theme,
    page = '1',
    limit = '20',
  } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    res.json({ songs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    return;
  }

  const query = q.trim();
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Search by number if query is numeric
  const songNumber = parseInt(query, 10);
  const isNumberSearch = !isNaN(songNumber) && songNumber > 0;

  const where: Record<string, unknown> = {
    OR: [
      ...(isNumberSearch ? [{ songNumber }] : []),
      { title: { contains: query } },
      { lyrics: { contains: query } },
      { category: { contains: query } },
      { theme: { contains: query } },
    ],
  };

  if (bookId) where.hymnBookId = bookId;
  if (category) where.category = category;
  if (theme) where.theme = theme;

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: {
        hymnBook: { select: { id: true, name: true, shortName: true } },
        tags: { select: { tag: true } },
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
      orderBy: [
        ...(isNumberSearch ? [{ songNumber: 'asc' as const }] : []),
        { title: 'asc' as const },
      ],
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
    query,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
