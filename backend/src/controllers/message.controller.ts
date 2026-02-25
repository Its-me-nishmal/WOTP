import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ApiKey } from '../models/ApiKey';
import { User, IUser } from '../models/User';
import { MessageLog } from '../models/MessageLog';
import { messageQueue } from '../jobs/message.queue';
import { hashApiKey } from '../services/otp.service';
import { whatsappService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const sendMessageSchema = z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
    content: z.string().min(1).max(2048),
    sessionId: z.string().optional(),
});

/**
 * POST /message/send
 * Authenticated via API key
 */
export const sendTransactionalMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, content, sessionId = 'default' } = sendMessageSchema.parse(req.body);

        // Resolve API Key
        const rawKey = req.headers.authorization?.split(' ')[1];
        if (!rawKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }

        const hashedKey = hashApiKey(rawKey);
        const apiKey = await ApiKey.findOne({ key: hashedKey, isActive: true }).populate('userId');
        if (!apiKey) {
            res.status(401).json({ error: 'Invalid or revoked API key' });
            return;
        }

        const user = apiKey.userId as unknown as IUser;

        // Check WhatsApp Status for specific session
        const wsStatus = whatsappService.getStatus(String(user._id), sessionId);
        if (wsStatus === 'disconnected') {
            res.status(400).json({ error: `WhatsApp session (${sessionId}) is not connected.` });
            return;
        }

        // --- Rate Limiting Logic ---
        const now = new Date();
        const isNewDay = (user.lastDailyResetAt || new Date()).toDateString() !== now.toDateString();

        const dailyLimit = user.plan === 'pro' ? 2000 : 30;
        const monthlyLimit = user.plan === 'pro' ? 50000 : 250;

        const currentDailyCount = isNewDay ? 0 : (user.dailyMessageCount || 0);
        const currentMonthlyCount = user.messageUsageCount || 0;

        if (currentMonthlyCount >= monthlyLimit) {
            res.status(429).json({ error: `Monthly message quota exceeded (${monthlyLimit} for ${user.plan} plan)` });
            return;
        }

        if (currentDailyCount >= dailyLimit) {
            res.status(429).json({ error: `Daily message limit reached (${dailyLimit} for ${user.plan} plan)` });
            return;
        }

        // Update User usage
        const update: any = {
            $inc: { messageUsageCount: 1, dailyMessageCount: isNewDay ? 0 : 1 }
        };
        if (isNewDay) {
            update.lastDailyResetAt = now;
            update.dailyMessageCount = 1;
            update.dailyOtpCount = 0; // Reset OTPs too for consistency
        }
        await User.findByIdAndUpdate(user._id, update);

        // Log the message
        const log = await MessageLog.create({
            userId: user._id,
            apiKeyId: apiKey._id,
            phone,
            content,
            status: 'pending',
        });

        // Add to Queue
        await messageQueue.add('send-message', {
            userId: String(user._id),
            phone,
            content,
            apiKeyId: String(apiKey._id),
            sessionId,
        });

        // Update API key last used
        apiKey.lastUsedAt = new Date();
        await apiKey.save();

        res.json({ success: true, message: 'Message queued', phone });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        logger.error('Send message error', { err });
        res.status(500).json({ error: 'Failed to send message' });
    }
};

/**
 * GET /message/logs
 * Authenticated via JWT
 */
export const getMessageLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { page = 1, limit = 20, phone } = req.query;

        const query: any = { userId: user._id };
        if (phone) query.phone = new RegExp(String(phone), 'i');

        const logs = await MessageLog.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('apiKeyId', 'name');

        const total = await MessageLog.countDocuments(query);

        res.json({
            logs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        logger.error('Get message logs error', { err });
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};
