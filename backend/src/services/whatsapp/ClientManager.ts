/**
 * ClientManager.ts
 * Manages multiple Baileys socket instances (one per user).
 * Handles QR streaming via Redis Pub/Sub and automatic reconnection.
 */
import makeWASocket, {
    DisconnectReason,
    WASocket,
    fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { getRedis } from '../../config/redis';
import { useMongoAuthState, deleteSession } from './SessionStore';
import { User } from '../../models/User';
import { WhatsAppConnection } from '../../models/WhatsAppConnection';
import { logger } from '../../utils/logger';
import pino from 'pino';
import type { RedisClientType } from 'redis';

const QR_CHANNEL_PREFIX = 'whatsapp:qr:';

class ClientManager {
    private clients: Map<string, WASocket> = new Map();
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
    private sessionStatus: Map<string, 'connecting' | 'open' | 'closed'> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();

    private getCompositeKey(userId: string, sessionId: string): string {
        return `${userId}:${sessionId}`;
    }

    async startSession(userId: string, sessionId: string = 'default'): Promise<void> {
        const key = this.getCompositeKey(userId, sessionId);

        if (this.clients.has(key)) {
            logger.info(`Session already active for ${key}`);
            return;
        }

        // Set status to connecting
        this.sessionStatus.set(key, 'connecting');

        // Sync with WhatsAppConnection model
        WhatsAppConnection.findOneAndUpdate(
            { userId, sessionId },
            { status: 'connecting' },
            { upsert: true }
        ).catch(err => logger.error(`Failed to sync connecting status for ${key}`, err));

        // For 'default' session, we still update the main User field for backward compatibility
        if (sessionId === 'default') {
            User.findByIdAndUpdate(userId, { whatsappStatus: 'connecting' }).catch(err =>
                logger.error(`Failed to update user connecting status for ${userId}`, err)
            );
        }

        logger.info(`Starting WhatsApp session for ${key}`);
        const redis = getRedis() as RedisClientType;
        const { state, saveCreds } = await useMongoAuthState(userId, sessionId);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'warn' }) as any,
            browser: ['WOTP', 'Chrome', '120.0'],
            getMessage: async (key) => undefined,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 30000,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
        });

        this.clients.set(key, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                const channel = `${QR_CHANNEL_PREFIX}${key}`;
                await redis.publish(channel, JSON.stringify({ type: 'qr', qr }));
            }

            if (connection === 'open') {
                logger.info(`WhatsApp connected for ${key}`);
                this.sessionStatus.set(key, 'open');
                this.reconnectAttempts.delete(key);

                // Extract phone number from JID
                const phone = sock.user?.id.split(':')[0] || '';
                const name = sock.user?.name || '';

                await WhatsAppConnection.findOneAndUpdate(
                    { userId, sessionId },
                    { status: 'connected', phone, name }
                );

                if (sessionId === 'default') {
                    await User.findByIdAndUpdate(userId, { whatsappStatus: 'connected' });
                }

                const channel = `${QR_CHANNEL_PREFIX}${key}`;
                await redis.publish(channel, JSON.stringify({ type: 'connected' }));

                const timer = this.reconnectTimers.get(key);
                if (timer) clearTimeout(timer);
                this.reconnectTimers.delete(key);
            }

            if (connection === 'close') {
                this.sessionStatus.set(key, 'closed');
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const currentAttempts = (this.reconnectAttempts.get(key) || 0) + 1;
                this.reconnectAttempts.set(key, currentAttempts);

                const isUnauthorized = statusCode === DisconnectReason.loggedOut || statusCode === 401;
                const maxStrikesReached = currentAttempts >= 3;
                const shouldReconnect = !isUnauthorized && !maxStrikesReached && statusCode !== DisconnectReason.forbidden;

                logger.warn(`WhatsApp connection closed for ${key}`, { statusCode, shouldReconnect, attempt: currentAttempts });
                this.clients.delete(key);

                if (shouldReconnect) {
                    const delay = Math.min(5000 * Math.pow(2, currentAttempts - 1), 30000);
                    const timer = setTimeout(() => this.startSession(userId, sessionId), delay);
                    this.reconnectTimers.set(key, timer);
                    if (sessionId === 'default') {
                        await User.findByIdAndUpdate(userId, { whatsappStatus: 'connecting' });
                    }
                } else {
                    await deleteSession(userId, sessionId);
                    this.reconnectAttempts.delete(key);

                    await WhatsAppConnection.findOneAndUpdate({ userId, sessionId }, { status: 'disconnected' });

                    if (sessionId === 'default') {
                        await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
                    }
                    const channel = `${QR_CHANNEL_PREFIX}${key}`;
                    const reason = maxStrikesReached ? 'Max reconnection attempts reached' : (isUnauthorized ? 'Session unauthorized' : 'Connection failed permanently');
                    await redis.publish(channel, JSON.stringify({ type: 'error', message: reason }));
                }
            }
        });

        setTimeout(() => {
            if (this.sessionStatus.get(key) === 'connecting') {
                logger.warn(`Session for ${key} stuck in connecting, cleaning up...`);
                this.stopSession(userId, sessionId);
            }
        }, 120000);
    }

    async stopSession(userId: string, sessionId: string = 'default'): Promise<void> {
        const key = this.getCompositeKey(userId, sessionId);
        const sock = this.clients.get(key);
        if (sock) {
            try { await sock.logout(); } catch (e) { }
            this.clients.delete(key);
        }
        const timer = this.reconnectTimers.get(key);
        if (timer) clearTimeout(timer);
        this.reconnectTimers.delete(key);

        await deleteSession(userId, sessionId);

        await WhatsAppConnection.findOneAndUpdate({ userId, sessionId }, { status: 'disconnected' });

        if (sessionId === 'default') {
            await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
        }
        logger.info(`Session stopped for ${key}`);
    }

    async sendMessage(userId: string, phone: string, text: string, sessionId: string = 'default'): Promise<void> {
        const key = this.getCompositeKey(userId, sessionId);
        const attempts = 3;
        let lastError: any;

        for (let i = 0; i < attempts; i++) {
            try {
                let sock = this.clients.get(key);
                let status = this.sessionStatus.get(key);

                if (!sock) {
                    throw new Error(`No active WhatsApp session for ${key}`);
                }

                if (status === 'connecting') {
                    logger.info(`Session for ${key} is connecting, waiting 3s...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    status = this.sessionStatus.get(key);
                    sock = this.clients.get(key);
                }

                if (!sock || status !== 'open') {
                    throw new Error(`WhatsApp session not ready (status: ${status})`);
                }

                const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
                await sock.sendMessage(jid, { text });
                return;
            } catch (err: any) {
                lastError = err;
                logger.warn(`Failed to send message via ${key}: ${err.message}`);
                if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        throw lastError;
    }

    getStatus(userId: string, sessionId: string = 'default'): 'connecting' | 'connected' | 'disconnected' | null {
        const key = this.getCompositeKey(userId, sessionId);
        const status = this.sessionStatus.get(key);
        if (status === 'open') return 'connected';
        if (status === 'connecting') return 'connecting';
        if (status === 'closed') return 'disconnected';
        return null;
    }
}

// Singleton instance shared across the app
export const clientManager = new ClientManager();
