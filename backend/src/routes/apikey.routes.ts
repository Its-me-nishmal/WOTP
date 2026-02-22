import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createApiKey, listApiKeys, deleteApiKey } from '../controllers/apikey.controller';

const router = Router();

router.use(authenticate);
router.post('/create', createApiKey);
router.get('/list', listApiKeys);
router.delete('/:id', deleteApiKey);

export default router;
