import { prisma } from '../../config/database';

export class LeaderboardService {
  async getGlobalLeaderboard(limit = 100) {
    return prisma.userStats.findMany({
      orderBy: { currentRating: 'desc' },
      take: limit,
      include: { user: { include: { profile: true } } },
    });
  }
  
  async getWeeklyLeaderboard(limit = 100) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return prisma.matchHistory.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo }, result: 'WIN' },
      _count: { result: true },
      orderBy: { _count: { result: 'desc' } },
      take: limit,
    });
  }
  
  async getFriendsLeaderboard(userId: string, limit = 50) {
    const friends = await prisma.friend.findMany({
      where: { userId },
      select: { friendId: true },
    });
    const friendIds = [userId, ...friends.map(f => f.friendId)];
    
    return prisma.userStats.findMany({
      where: { userId: { in: friendIds } },
      orderBy: { currentRating: 'desc' },
      take: limit,
      include: { user: { include: { profile: true } } },
    });
  }
}

export const leaderboardService = new LeaderboardService();
