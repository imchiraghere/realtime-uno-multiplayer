import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { getStats, getReports, reviewReport, banUser, getUsers } from './admin.controller';

const router = Router();
router.use(authenticate as any, requireAdmin as any);

router.get('/stats', getStats);
router.get('/reports', getReports);
router.put('/reports/:id', reviewReport);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);

export default router;
