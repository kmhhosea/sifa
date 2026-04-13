import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const favoriteRoutes = Router();

// All favorites routes require authentication
favoriteRoutes.use(authenticate);

// List user's favorites
favoriteRoutes.get('/', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: req.userId },
      include: {
        song: {
          include: {
            hymnBook: { select: { id: true, name: true, shortName: true } },
            tags: { select: { tag: true } },
            _count: {
              select: {
                favorites: true,
                generatedAudios: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.favorite.count({ where: { userId: req.userId } }),
  ]);

  res.json({
    favorites: favorites.map((f) => ({
      id: f.id,
      song: { ...f.song, isFavorite: true },
      createdAt: f.createdAt,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// Toggle favorite
favoriteRoutes.post('/:songId', async (req: AuthRequest, res) => {
  const { songId } = req.params;

  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) {
    throw new AppError('Song not found', 404);
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_songId: {
        userId: req.userId!,
        songId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.json({ isFavorite: false, message: 'Removed from favorites' });
  } else {
    await prisma.favorite.create({
      data: {
        userId: req.userId!,
        songId,
      },
    });
    res.json({ isFavorite: true, message: 'Added to favorites' });
  }
});
