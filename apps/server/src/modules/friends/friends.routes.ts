import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendRequest, respondRequest, getFriends, getPendingRequests } from './friends.controller';

const router = Router();

router.use(authenticate as any);
router.get('/', getFriends as Parameters<typeof router.get>[1]);
router.get('/requests', getPendingRequests as Parameters<typeof router.get>[1]);
router.post('/request/:userId', sendRequest as Parameters<typeof router.post>[1]);
router.put('/request/:requestId', respondRequest as Parameters<typeof router.put>[1]);

export default router;
