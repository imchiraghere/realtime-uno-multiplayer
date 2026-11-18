import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createRoom, joinRoom, getPublicRooms, getRoomByCode } from './rooms.controller';

const router = Router();

router.get('/', getPublicRooms);
router.get('/:code', getRoomByCode);
router.post('/', authenticate, createRoom as Parameters<typeof router.post>[1]);
router.post('/:code/join', authenticate, joinRoom as Parameters<typeof router.post>[1]);

export default router;
