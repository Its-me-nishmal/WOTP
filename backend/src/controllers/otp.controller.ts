import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ApiKey } from '../models/ApiKey';
import { IUser } from '../models/User';
import { hashApiKey, generateAndStoreOtp, verifyOtp } from '../services/otp.service';
import { OtpLog } from '../models/OtpLog';
import { otpQueue } from '../jobs/otp.queue';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

const sendSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
    apiKeyId: z.string().optional(), // Used in Test Console to select specific key
    length: z.number().min(4).max(12).optional(),
    type: z.enum(['numeric', 'alphanumeric', 'alpha']).optional(),
    expiresIn: z.number().min(30).max(3600).optional(), // 30s to 1 hour
    message: z.string().optional(),
});

const verifySchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
    otp: z.string().min(4).max(12, 'OTP is too long'),
});

/**
 * POST /otp/send
 * Authenticated via API key in Authorization header: "Bearer wk_..."
 */
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, length, type, expiresIn, message } = sendSchema.parse(req.body);

        // Resolve API Key from Authorization header
        const rawKey = req.headers.authorization?.split(' ')[1];
        if (!rawKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }

        const hashedKey = hashApiKey(rawKey);
        const apiKey = await ApiKey.findOne({
            $or: [{ key: hashedKey }, { key: rawKey }],
            isActive: true
        }).populate('userId');
        if (!apiKey) {
            res.status(401).json({ error: 'Invalid or revoked API key' });
            return;
        }

        const user = apiKey.userId as unknown as IUser;

        // Check WhatsApp Status
        const wsStatus = whatsappService.getStatus(String(user._id));
        if (wsStatus === 'disconnected') {
            res.status(400).json({ error: 'WhatsApp is not connected. Please connect your WhatsApp in the dashboard.' });
            return;
        }

        const otp = await generateAndStoreOtp(
            String(user._id),
            String(apiKey._id),
            phone,
            user.plan,
            user.usageCount,
            user.dailyOtpCount || 0,
            user.lastDailyResetAt || new Date(),
            { length, type, expiresIn }
        );

        // Push delivery job to BullMQ
        await otpQueue.add('send-otp', {
            userId: String(user._id),
            phone,
            otp,
            apiKeyId: String(apiKey._id),
            message,
        });
        logger.info(`Added OTP job for ${phone} to queue`);

        // Update API key last used
        apiKey.lastUsedAt = new Date();
        await apiKey.save();

        res.json({ success: true, message: 'OTP sent', phone });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        if (err instanceof Error && err.message.includes('quota')) {
            res.status(429).json({ error: err.message });
            return;
        }
        if (err instanceof Error && err.message.includes('limit')) {
            res.status(429).json({ error: err.message });
            return;
        }
        logger.error('Send OTP error', { err });
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

/**
 * POST /otp/verify
 * Authenticated via API key in Authorization header.
 */
export const verifyOtpHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, otp } = verifySchema.parse(req.body);

        const rawKey = req.headers.authorization?.split(' ')[1];
        if (!rawKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }

        const hashedKey = hashApiKey(rawKey);
        const apiKey = await ApiKey.findOne({
            $or: [{ key: hashedKey }, { key: rawKey }],
            isActive: true
        }).populate('userId');
        if (!apiKey) {
            res.status(401).json({ error: 'Invalid or revoked API key' });
            return;
        }

        const user = apiKey.userId as any;
        const isValid = await verifyOtp(String(user._id), phone, otp);

        if (!isValid) {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            return;
        }

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        logger.error('Verify OTP error', { err });
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};

/**
 * POST /otp/test
 * Authenticated via JWT (Dashboard Tester)
 */
export const sendTestOtp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, apiKeyId, length, type, expiresIn, message } = sendSchema.parse(req.body);
        const user = req.user!;

        // For internal tests, we use the provided apiKeyId or find the first active key
        let apiKey;
        if (apiKeyId) {
            apiKey = await ApiKey.findOne({ _id: apiKeyId, userId: user._id, isActive: true });
        } else {
            apiKey = await ApiKey.findOne({ userId: user._id, isActive: true });
        }

        if (!apiKey) {
            res.status(400).json({ error: 'Please select a valid active API Key first.' });
            return;
        }

        // Check WhatsApp Status
        const wsStatus = whatsappService.getStatus(String(user._id));
        if (wsStatus === 'disconnected') {
            res.status(400).json({ error: 'WhatsApp session not found. Please go to the WhatsApp tab and connect.' });
            return;
        }

        const otp = await generateAndStoreOtp(
            String(user._id),
            String(apiKey._id),
            phone,
            user.plan,
            user.usageCount,
            user.dailyOtpCount || 0,
            user.lastDailyResetAt || new Date(),
            { length, type, expiresIn }
        );

        await otpQueue.add('send-otp', {
            userId: String(user._id),
            phone,
            otp,
            apiKeyId: String(apiKey._id),
            message,
        });
        logger.info(`Added Test OTP job for ${phone} to queue`);

        res.json({ success: true, message: 'Test OTP sent', phone });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        if (err instanceof Error && err.message.includes('limit')) {
            res.status(429).json({ error: err.message });
            return;
        }
        logger.error('Send test OTP error', { err });
        res.status(500).json({ error: 'Failed to send test OTP' });
    }
};

/**
 * POST /otp/test-verify
 * Authenticated via JWT
 */
export const verifyTestOtp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, otp } = verifySchema.parse(req.body);
        const user = req.user!;

        const isValid = await verifyOtp(String(user._id), phone, otp);

        if (!isValid) {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            return;
        }

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        logger.error('Verify test OTP error', { err });
        res.status(500).json({ error: 'Failed to verify test OTP' });
    }
};
