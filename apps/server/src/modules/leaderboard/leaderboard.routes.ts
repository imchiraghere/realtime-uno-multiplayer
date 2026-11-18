import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getGlobalLeaderboard, getWeeklyLeaderboard, getFriendsLeaderboard } from './leaderboard.controller';

const router = Router();

router.get('/', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/friends', authenticate, getFriendsLeaderboard as Parameters<typeof router.get>[1]);

export default router;
