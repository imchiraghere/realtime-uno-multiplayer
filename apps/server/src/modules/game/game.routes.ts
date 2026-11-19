import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getGame,
  playCard,
  drawCard,
  declareUno,
  challengeWild,
  chooseColor,
} from './game.controller';

const router = Router();

router.get('/:roomId', authenticate, getGame as Parameters<typeof router.get>[1]);
router.post('/:roomId/play', authenticate, playCard as Parameters<typeof router.post>[1]);
router.post('/:roomId/draw', authenticate, drawCard as Parameters<typeof router.post>[1]);
router.post('/:roomId/uno', authenticate, declareUno as Parameters<typeof router.post>[1]);
router.post('/:roomId/challenge', authenticate, challengeWild as Parameters<typeof router.post>[1]);
router.post('/:roomId/color', authenticate, chooseColor as Parameters<typeof router.post>[1]);

export default router;

