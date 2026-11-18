import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getProfile, updateProfile, getMatchHistory, searchUsers } from './users.controller';

const router = Router();

router.get('/search', searchUsers);
router.get('/me', authenticate, getProfile as Parameters<typeof router.get>[1]);
router.put('/me/profile', authenticate, updateProfile as Parameters<typeof router.put>[1]);
router.get('/me/history', authenticate, getMatchHistory as Parameters<typeof router.get>[1]);
router.get('/:id', getProfile as Parameters<typeof router.get>[1]);
router.get('/:id/history', getMatchHistory as Parameters<typeof router.get>[1]);

export default router;
