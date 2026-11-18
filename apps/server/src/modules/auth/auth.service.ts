import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      if (existing.email === email) throw new Error('Email already in use');
      throw new Error('Username already taken');
    }
    
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        profile: { create: {} },
        stats: { create: {} },
      },
      include: { profile: true, stats: true },
    });
    
    const token = generateToken({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
    return { user, token };
  }
  
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new Error('Invalid credentials');
    if (user.isBanned) throw new Error('Account banned');
    
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');
    
    const token = generateToken({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
    return { user, token };
  }
  
  async createGuestUser() {
    const username = `Guest_${uuidv4().slice(0, 8)}`;
    const user = await prisma.user.create({
      data: {
        username,
        isGuest: true,
        profile: { create: {} },
        stats: { create: {} },
      },
      include: { profile: true, stats: true },
    });
    
    const token = generateToken({ userId: user.id, username: user.username, isAdmin: false });
    return { user, token };
  }
  
  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, stats: true },
    });
  }
}

export const authService = new AuthService();
