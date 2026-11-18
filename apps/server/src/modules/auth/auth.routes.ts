import { Router } from 'express';
import { register, login, guest, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guest);
router.get('/me', authenticate, getMe as Parameters<typeof router.get>[1]);

export default router;
