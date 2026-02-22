import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { connectWhatsApp, disconnectWhatsApp, getWhatsAppStatus } from '../controllers/whatsapp.controller';

const router = Router();

router.use(authenticate);
router.post('/connect', connectWhatsApp);
router.delete('/disconnect', disconnectWhatsApp);
router.get('/status', getWhatsAppStatus);

export default router;
