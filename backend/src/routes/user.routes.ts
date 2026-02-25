import { Router } from 'express';
import { authenticate, authenticateApiKey } from '../middleware/auth';
import { getMe, getLogs, getStats } from '../controllers/user.controller';

const router = Router();

// JWT-protected (Dashboard)
router.use(authenticate);
router.get('/me', getMe);
router.get('/logs', getLogs);
router.get('/stats', getStats);

export default router;

// Separate router for API key-protected endpoints (SDK)
export const userApiRouter = Router();
userApiRouter.get('/usage', authenticateApiKey, getStats);
