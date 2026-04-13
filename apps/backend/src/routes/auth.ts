import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
  language: z.enum(['sw', 'en']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
authRoutes.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      language: data.language || 'sw',
    },
  });

  const token = generateToken(user.id, user.role);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      language: user.language,
    },
    token,
  });
});

// Login
authRoutes.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user.id, user.role);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      language: user.language,
    },
    token,
  });
});

// Get current user
authRoutes.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      language: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
});
