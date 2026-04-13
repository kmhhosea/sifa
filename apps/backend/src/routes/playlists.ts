import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const playlistRoutes = Router();

playlistRoutes.use(authenticate);

const createPlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  isServicePlan: z.boolean().optional(),
  serviceDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const addItemSchema = z.object({
  songId: z.string(),
  position: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

// List user's playlists
playlistRoutes.get('/', async (req: AuthRequest, res) => {
  const playlists = await prisma.playlist.findMany({
    where: { userId: req.userId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ playlists });
});

// Create playlist
playlistRoutes.post('/', async (req: AuthRequest, res) => {
  const data = createPlaylistSchema.parse(req.body);

  const playlist = await prisma.playlist.create({
    data: {
      ...data,
      serviceDate: data.serviceDate ? new Date(data.serviceDate) : undefined,
      userId: req.userId!,
    },
  });

  res.status(201).json({ playlist });
});

// Get playlist with items
playlistRoutes.get('/:id', async (req: AuthRequest, res) => {
  const playlist = await prisma.playlist.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      items: {
        include: {
          song: {
            include: {
              hymnBook: { select: { id: true, name: true, shortName: true } },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  res.json({ playlist });
});

// Add item to playlist
playlistRoutes.post('/:id/items', async (req: AuthRequest, res) => {
  const data = addItemSchema.parse(req.body);

  const playlist = await prisma.playlist.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { _count: { select: { items: true } } },
  });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  const position = data.position ?? playlist._count.items;

  const item = await prisma.playlistItem.create({
    data: {
      playlistId: req.params.id,
      songId: data.songId,
      position,
      notes: data.notes,
    },
    include: {
      song: {
        include: {
          hymnBook: { select: { id: true, name: true, shortName: true } },
        },
      },
    },
  });

  res.status(201).json({ item });
});

// Delete playlist
playlistRoutes.delete('/:id', async (req: AuthRequest, res) => {
  const playlist = await prisma.playlist.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  await prisma.playlist.delete({ where: { id: req.params.id } });
  res.json({ message: 'Playlist deleted' });
});

// Remove item from playlist
playlistRoutes.delete('/:id/items/:itemId', async (req: AuthRequest, res) => {
  const playlist = await prisma.playlist.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  await prisma.playlistItem.delete({ where: { id: req.params.itemId } });
  res.json({ message: 'Item removed' });
});
