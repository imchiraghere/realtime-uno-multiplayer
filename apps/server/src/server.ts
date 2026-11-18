import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import friendsRoutes from './modules/friends/friends.routes';
import adminRoutes from './modules/admin/admin.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';

import { initializeSockets } from './sockets';
import { achievementsService } from './modules/achievements/achievements.service';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { renderLandingPage } from './views/landingPage';

const app = express();
const httpServer = createServer(app);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or any localhost/127.0.0.1 port
    if (
      !origin ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin === config.clientUrl
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression() as any);
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Root Landing Page
app.get('/', (_req, res) => {
  res.type('html').send(renderLandingPage(config));
});

// Health check
app.get(['/health', '/api/health'], async (_req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  try {
    const pingResult = await redis.ping();
    redisStatus = pingResult === 'PONG' ? 'connected' : 'degraded';
  } catch (err) {
    redisStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    services: {
      server: 'running',
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

app.use(errorHandler);

// Initialize sockets
initializeSockets(io);

// Initialize achievements
achievementsService.initAchievements().catch(err => logger.error('Achievement init error', err));

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${config.port} is already in use by another process.`);
    if (config.port === 5000) {
      logger.error(`💡 On macOS, port 5000 is occupied by Apple's AirPlay Receiver (AirTunes).`);
      logger.error(`   To free port 5000: System Settings > General > AirDrop & AirPlay > Toggle "AirPlay Receiver" to OFF.`);
      logger.error(`   Alternatively, set backend port to 5001.`);
    }
  } else {
    logger.error('Server error', err);
  }
});

if (!process.env.VERCEL) {
  httpServer.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
}

export { app, httpServer, io };
export default app;
