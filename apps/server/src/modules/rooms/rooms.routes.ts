import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createRoom,
  joinRoom,
  getPublicRooms,
  getRoomByCode,
  setReady,
  startGame,
  leaveRoom,
  streamRoomEvents,
} from './rooms.controller';

const router = Router();

router.get('/', getPublicRooms);
router.get('/:code/events', streamRoomEvents as Parameters<typeof router.get>[1]);
router.get('/:code', getRoomByCode);
router.post('/', authenticate, createRoom as Parameters<typeof router.post>[1]);
router.post('/:code/join', authenticate, joinRoom as Parameters<typeof router.post>[1]);
router.post('/:code/ready', authenticate, setReady as Parameters<typeof router.post>[1]);
router.post('/:code/start', authenticate, startGame as Parameters<typeof router.post>[1]);
router.post('/:code/leave', authenticate, leaveRoom as Parameters<typeof router.post>[1]);

export default router;
