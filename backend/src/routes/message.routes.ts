import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendTransactionalMessage, getMessageLogs } from '../controllers/message.controller';

const router = Router();

// Public-ish API endpoint (requires API Key auth handled in controller)
router.post('/send', sendTransactionalMessage);

// Authenticated Dashboard endpoint
router.get('/logs', authenticate, getMessageLogs);

export default router;
