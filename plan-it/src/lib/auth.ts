import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'taskpulse-jwt-super-secret-key-2026-production';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    } catch (e) {}
  }

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Verify that the user actually exists in database
  const { prisma } = await import('@/lib/db');
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}
