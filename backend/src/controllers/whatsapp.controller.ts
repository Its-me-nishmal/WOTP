import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

export const connectWhatsApp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = String(req.user!._id);

        // Start session in the background
        await whatsappService.connect(userId);

        // Subscribe to QR updates for this user
        const redis = req.app.get('redis'); // Assuming redis client is attached to app
        const sub = redis.duplicate();
        await sub.connect();

        const channel = `whatsapp:qr:${userId}`;
        let qrReceived = false;

        // Set a timeout to avoid hanging the request
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
        await whatsappService.disconnect(userId);
        await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
        res.json({ message: 'WhatsApp disconnected' });
    } catch (err) {
        logger.error('WhatsApp disconnect error', { err });
        res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
};

export const getWhatsAppStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const liveStatus = whatsappService.getStatus(String(user._id));
    res.json({ status: liveStatus ?? user.whatsappStatus });
};
