import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateToken(userId: string, role: string): string {
  const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days
  return jwt.sign({ userId, role }, SECRET, { expiresIn: expiresInSeconds });
}
