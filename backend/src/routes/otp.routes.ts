import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtp, verifyOtpHandler, sendTestOtp, verifyTestOtp } from '../controllers/otp.controller';
import { authenticate } from '../middleware/auth';

const otpRateLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute window
    max: 5,                     // max 5 OTP requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many OTP requests. Please wait before trying again.' },
});

const router = Router();

// Public/API Key routes
router.post('/send', otpRateLimiter, sendOtp);
router.post('/verify', verifyOtpHandler);

// Dashboard routes (JWT)
router.post('/test', authenticate, sendTestOtp);
router.post('/test-verify', authenticate, verifyTestOtp);

export default router;
