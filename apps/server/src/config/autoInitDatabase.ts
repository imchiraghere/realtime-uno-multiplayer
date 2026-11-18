import { prisma } from './database';
import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { achievementsService } from '../modules/achievements/achievements.service';

const SCHEMA_DDL = `
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnums safely
DO $$ BEGIN
  CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'PLAYING', 'FINISHED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GameMode" AS ENUM ('CLASSIC', 'HOUSE_RULES', 'QUICK_MATCH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'FINISHED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Tables IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "country" TEXT,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highestScore" INTEGER NOT NULL DEFAULT 0,
    "currentRating" INTEGER NOT NULL DEFAULT 1000,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Friend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GameRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "gameMode" "GameMode" NOT NULL DEFAULT 'CLASSIC',
    "turnTimerSeconds" INTEGER NOT NULL DEFAULT 30,
    "scoreLimit" INTEGER NOT NULL DEFAULT 500,
    "houseRules" JSONB NOT NULL DEFAULT '{}',
    "allowBots" BOOLEAN NOT NULL DEFAULT false,
    "spectatorMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GameRoomPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "botDifficulty" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameRoomPlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GameSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "direction" INTEGER NOT NULL DEFAULT 1,
    "currentPlayerIndex" INTEGER NOT NULL DEFAULT 0,
    "currentColor" TEXT NOT NULL DEFAULT 'red',
    "drawCount" INTEGER NOT NULL DEFAULT 0,
    "turnNumber" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GamePlayer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "cardCount" INTEGER NOT NULL DEFAULT 7,
    "hasCalledUno" BOOLEAN NOT NULL DEFAULT false,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "score" INTEGER NOT NULL DEFAULT 0,
    "finalPosition" INTEGER,
    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GameEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "result" "MatchResult" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "week" TEXT,
    "month" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserStats_userId_key" ON "UserStats"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Friend_userId_friendId_key" ON "Friend"("userId", "friendId");
CREATE UNIQUE INDEX IF NOT EXISTS "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");
CREATE UNIQUE INDEX IF NOT EXISTS "GameRoom_code_key" ON "GameRoom"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "GameRoomPlayer_roomId_userId_key" ON "GameRoomPlayer"("roomId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "GameRoomPlayer_roomId_seat_key" ON "GameRoomPlayer"("roomId", "seat");
CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_key_key" ON "Achievement"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerBlock_blockerId_blockedId_key" ON "PlayerBlock"("blockerId", "blockedId");

-- Foreign Keys safely added
DO $$ BEGIN
  ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GameRoomPlayer" ADD CONSTRAINT "GameRoomPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GameRoomPlayer" ADD CONSTRAINT "GameRoomPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PlayerReport" ADD CONSTRAINT "PlayerReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PlayerReport" ADD CONSTRAINT "PlayerReport_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PlayerBlock" ADD CONSTRAINT "PlayerBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PlayerBlock" ADD CONSTRAINT "PlayerBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
`;

export async function seedTestPlayers(): Promise<number> {
  const defaultPassword = await hashPassword('password123');
  const adminPassword = await hashPassword('admin123');

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
      bio: 'Competitive UNO strategist & card counter',
      country: 'US',
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
      bio: 'Wild draw four enthusiast',
      country: 'GB',
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
      bio: 'Casual Friday night UNO player',
      country: 'CA',
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
      bio: 'Official UNO Server Administrator',
      country: 'IN',
    },
  ];

  let seededCount = 0;
  for (const u of testUsers) {
    try {
      await prisma.user.upsert({
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
              bio: u.bio,
              country: u.country,
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
      seededCount++;
    } catch (err) {
      logger.error(`Error seeding test user ${u.username}`, err);
    }
  }

  // Also initialize achievements
  try {
    await achievementsService.initAchievements();
  } catch (err) {
    logger.warn('Achievement init note during seed', err);
  }

  return seededCount;
}

let initPromise: Promise<{ initialized: boolean; tablesCreated: boolean; seededCount: number }> | null = null;

export async function ensureDatabaseInitialized(): Promise<{
  initialized: boolean;
  tablesCreated: boolean;
  seededCount: number;
}> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Step 1: Check if "User" table exists
      const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `;

      const userTableExists = tableCheck && tableCheck[0]?.exists === true;

      let tablesCreated = false;
      let seededCount = 0;

      if (!userTableExists) {
        logger.info('📦 Table "User" not found. Auto-creating database schema...');
        await prisma.$executeRawUnsafe(SCHEMA_DDL);
        logger.info('✅ Database schema and tables created successfully!');
        tablesCreated = true;

        logger.info('🌱 Auto-seeding test players and initial records...');
        seededCount = await seedTestPlayers();
        logger.info(`✅ Seeded ${seededCount} test players successfully!`);
      } else {
        // Tables exist, check if test players exist
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          logger.info('🌱 Database is empty. Seeding test players...');
          seededCount = await seedTestPlayers();
          logger.info(`✅ Seeded ${seededCount} test players successfully!`);
        }
      }

      return { initialized: true, tablesCreated, seededCount };
    } catch (err) {
      logger.error('❌ Failed to auto-initialize database:', err);
      // Reset promise so next request can retry if DB was temporarily unreachable
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}
