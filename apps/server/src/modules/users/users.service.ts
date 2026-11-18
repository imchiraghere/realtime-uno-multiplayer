import { prisma } from '../../config/database';

export class UsersService {
  async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, stats: true },
    });
  }
  
  async updateProfile(userId: string, data: { avatarUrl?: string; bio?: string; country?: string }) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
  
  async getMatchHistory(userId: string, limit = 20) {
    return prisma.matchHistory.findMany({
      where: { userId },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
  
  async searchUsers(query: string, limit = 20) {
    return prisma.user.findMany({
      where: { username: { contains: query, mode: 'insensitive' }, isGuest: false },
      select: { id: true, username: true, profile: { select: { avatarUrl: true } }, stats: true },
      take: limit,
    });
  }
}

export const usersService = new UsersService();
