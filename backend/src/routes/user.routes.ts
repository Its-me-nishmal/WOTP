import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, getLogs, getStats } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/me', getMe);
router.get('/logs', getLogs);
router.get('/stats', getStats);

export default router;
