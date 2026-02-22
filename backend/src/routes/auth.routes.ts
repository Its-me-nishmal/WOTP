import { Router } from 'express';
import { googleLogin, refreshToken, logout, devLogin } from '../controllers/auth.controller';

const router = Router();

router.post('/google', googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/dev-login', devLogin);

export default router;
