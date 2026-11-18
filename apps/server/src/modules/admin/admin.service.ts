import { prisma } from '../../config/database';

export class AdminService {
  async getStats() {
    const [totalUsers, activeRooms, ongoingGames, completedGames, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.gameRoom.count({ where: { status: 'WAITING' } }),
      prisma.gameRoom.count({ where: { status: 'PLAYING' } }),
      prisma.gameRoom.count({ where: { status: 'FINISHED' } }),
      prisma.playerReport.count({ where: { status: 'PENDING' } }),
    ]);
    
    return { totalUsers, activeRooms, ongoingGames, completedGames, pendingReports };
  }
  
  async getReports(status = 'PENDING') {
    return prisma.playerReport.findMany({
      where: { status: status as 'PENDING' | 'REVIEWED' | 'DISMISSED' },
      include: { reporter: { select: { username: true } }, reported: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async reviewReport(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    return prisma.playerReport.update({ where: { id: reportId }, data: { status } });
  }
  
  async banUser(userId: string, banned: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isBanned: banned } });
  }
  
  async getUsers(search?: string) {
    return prisma.user.findMany({
      where: search ? { username: { contains: search, mode: 'insensitive' } } : undefined,
      include: { stats: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

export const adminService = new AdminService();
