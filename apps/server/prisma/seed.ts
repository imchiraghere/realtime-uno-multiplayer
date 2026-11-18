import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const defaultPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);

  const testUsers = [
    {
      email: 'player1@uno.com',
      username: 'Alice',
      passwordHash: defaultPassword,
      isAdmin: false,
      rating: 1200,
      wins: 15,
      losses: 5,
      level: 3,
      xp: 1500,
    },
    {
      email: 'player2@uno.com',
      username: 'Bob',
      passwordHash: defaultPassword,
      isAdmin: false,
      rating: 1150,
      wins: 10,
      losses: 8,
      level: 2,
      xp: 1000,
    },
    {
      email: 'player3@uno.com',
      username: 'Charlie',
      passwordHash: defaultPassword,
      isAdmin: false,
      rating: 1050,
      wins: 4,
      losses: 6,
      level: 1,
      xp: 400,
    },
    {
      email: 'admin@uno.com',
      username: 'Admin',
      passwordHash: adminPassword,
      isAdmin: true,
      rating: 1500,
      wins: 50,
      losses: 12,
      level: 10,
      xp: 5000,
    },
  ];

  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: u.passwordHash,
        isAdmin: u.isAdmin,
      },
      create: {
        email: u.email,
        username: u.username,
        passwordHash: u.passwordHash,
        isAdmin: u.isAdmin,
        isGuest: false,
        profile: {
          create: {
            bio: `UNO competitive player ${u.username}`,
            country: 'US',
          },
        },
        stats: {
          create: {
            totalGames: u.wins + u.losses,
            wins: u.wins,
            losses: u.losses,
            winRate: Math.round((u.wins / (u.wins + u.losses)) * 100),
            highestScore: 250,
            currentRating: u.rating,
            level: u.level,
            xp: u.xp,
          },
        },
      },
    });

    console.log(`✅ Seeded user: ${user.username} (${u.email})`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

