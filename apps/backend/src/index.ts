import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { songRoutes } from './routes/songs';
import { authRoutes } from './routes/auth';
import { favoriteRoutes } from './routes/favorites';
import { playlistRoutes } from './routes/playlists';
import { searchRoutes } from './routes/search';
import { errorHandler } from './middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sifa-api', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/playlists', playlistRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✦ Sifa API running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
