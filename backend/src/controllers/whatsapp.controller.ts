import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { WhatsAppConnection } from '../models/WhatsAppConnection';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

export const connectWhatsApp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = String(req.user!._id);
        const { sessionId = 'default' } = req.query;

        // Start session in the background
        await whatsappService.connect(userId, sessionId as string);

        // Subscribe to QR updates for this user
        const redis = req.app.get('redis');
        const sub = redis.duplicate();
        await sub.connect();

        const channel = `whatsapp:qr:${userId}:${sessionId}`;
        let qrReceived = false;

        const timeout = setTimeout(async () => {
            if (!qrReceived) {
                await sub.unsubscribe(channel);
                await sub.quit();
                res.status(504).json({ error: 'Timeout waiting for QR code' });
            }
        }, 30000);

        await sub.subscribe(channel, async (message: string) => {
            const data = JSON.parse(message);
            if (data.type === 'qr') {
                qrReceived = true;
                clearTimeout(timeout);
                await sub.unsubscribe(channel);
                await sub.quit();
                res.json({ message: 'Scan QR to connect WhatsApp', qrCode: data.qr });
            } else if (data.type === 'error' || data.type === 'connected') {
                qrReceived = true;
                clearTimeout(timeout);
                await sub.unsubscribe(channel);
                await sub.quit();
                res.json({ message: data.type === 'connected' ? 'WhatsApp already connected' : data.message, status: data.type });
            }
        });

    } catch (err) {
        logger.error('WhatsApp connect error', { err });
        res.status(500).json({ error: 'Failed to initiate WhatsApp connection' });
    }
};


export const disconnectWhatsApp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = String(req.user!._id);
        const { sessionId = 'default' } = req.query;

        await whatsappService.disconnect(userId, sessionId as string);

        if (sessionId === 'default') {
            await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
        }

        res.json({ message: `WhatsApp session ${sessionId} disconnected` });
    } catch (err) {
        logger.error('WhatsApp disconnect error', { err });
        res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
};

export const getWhatsAppStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id;
        const connections = await WhatsAppConnection.find({ userId }).lean();

        // Enhance with live status if available
        const enhanced = connections.map(conn => ({
            ...conn,
            status: whatsappService.getStatus(String(userId), conn.sessionId) || conn.status
        }));

        res.json({ connections: enhanced });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get status' });
    }
};
