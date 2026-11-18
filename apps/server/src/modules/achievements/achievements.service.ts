import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const ACHIEVEMENTS = [
  { key: 'first_victory', name: 'First Victory', description: 'Win your first game' },
  { key: 'ten_wins', name: 'Win Streak', description: 'Win 10 games total' },
  { key: 'hundred_matches', name: 'Century Player', description: 'Play 100 games total' },
  { key: 'uno_master', name: 'UNO Master', description: 'Declare UNO 10 times in matches' },
  { key: 'wild_expert', name: 'Wild Expert', description: 'Play 20 Wild Draw Four cards' },
  { key: 'comeback_king', name: 'Comeback King', description: 'Win with 1 card when others have 7+' },
  { key: 'perfect_game', name: 'Perfect Game', description: 'Win without drawing any cards' },
];

export class AchievementsService {
  async initAchievements() {
    for (const achievement of ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { key: achievement.key },
        create: achievement,
        update: {},
      });
    }
  }
  
  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    const awarded: string[] = [];
    
    try {
      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (!stats) return awarded;
      
      const unlocked = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      });
      const unlockedKeys = new Set(unlocked.map(u => u.achievement.key));
      
      const achievements = await prisma.achievement.findMany();
      const achievementMap = Object.fromEntries(achievements.map(a => [a.key, a]));
      
      const checkAndAward = async (key: string, condition: boolean) => {
        if (condition && !unlockedKeys.has(key) && achievementMap[key]) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: achievementMap[key].id },
          });
          awarded.push(key);
        }
      };
      
      await checkAndAward('first_victory', stats.wins === 1);
      await checkAndAward('ten_wins', stats.wins >= 10);
      await checkAndAward('hundred_matches', stats.totalGames >= 100);
      
    } catch (err) {
      logger.error('Achievement check error', err);
    }
    
    return awarded;
  }
  
  async getUserAchievements(userId: string) {
    return prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}

export const achievementsService = new AchievementsService();
