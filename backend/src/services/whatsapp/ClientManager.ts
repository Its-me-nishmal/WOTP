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
import { logger } from '../../utils/logger';
import pino from 'pino';
import type { RedisClientType } from 'redis';

const QR_CHANNEL_PREFIX = 'whatsapp:qr:';

class ClientManager {
    private clients: Map<string, WASocket> = new Map();
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
    private sessionStatus: Map<string, 'connecting' | 'open' | 'closed'> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();

    async startSession(userId: string): Promise<void> {
        if (this.clients.has(userId)) {
            logger.info(`Session already active for ${userId}`);
            return;
        }

        // Set status to connecting immediately to avoid race conditions
        this.sessionStatus.set(userId, 'connecting');
        User.findByIdAndUpdate(userId, { whatsappStatus: 'connecting' }).catch(err =>
            logger.error(`Failed to update initial connecting status for ${userId}`, err)
        );

        logger.info(`Starting WhatsApp session for user ${userId}`);
        const redis = getRedis() as RedisClientType;
        const { state, saveCreds } = await useMongoAuthState(userId);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'warn' }) as any,
            browser: ['WOTP', 'Chrome', '120.0'],
            // Add getMessage to handle retries for decrypted messages
            getMessage: async (key) => {
                // Return null or implement a basic store if needed
                return undefined;
            },
            // Improved connection behavior
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 30000,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
        });

        this.clients.set(userId, sock);

        sock.ev.on('creds.update', saveCreds);

        // Listen for new messages to handle decryption retries automatically
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    if (msg.messageStubType === 1 || msg.message?.protocolMessage) {
                        // This usually handles protocol-level retry requests
                        continue;
                    }
                    if (!msg.message) {
                        logger.warn(`[WhatsApp] Received message with no content from ${msg.key.remoteJid}`);
                    }
                }
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                const channel = `${QR_CHANNEL_PREFIX}${userId}`;
                await redis.publish(channel, JSON.stringify({ type: 'qr', qr }));
            }

            if (connection === 'open') {
                logger.info(`WhatsApp connected for user ${userId}`);
                this.sessionStatus.set(userId, 'open');
                this.reconnectAttempts.delete(userId); // Success! Reset strikes
                await User.findByIdAndUpdate(userId, { whatsappStatus: 'connected' });
                const channel = `${QR_CHANNEL_PREFIX}${userId}`;
                await redis.publish(channel, JSON.stringify({ type: 'connected' }));

                // Clear any pending reconnect timer
                const timer = this.reconnectTimers.get(userId);
                if (timer) clearTimeout(timer);
                this.reconnectTimers.delete(userId);
            }

            if (connection === 'close') {
                this.sessionStatus.set(userId, 'closed');
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

                // Strike counting logic
                const currentAttempts = (this.reconnectAttempts.get(userId) || 0) + 1;
                this.reconnectAttempts.set(userId, currentAttempts);

                // Should we try again?
                // Don't reconnect if:
                // 1. Manually logged out (401)
                // 2. Max strikes (3) reached
                // 3. Bad session data (403)
                const isUnauthorized = statusCode === DisconnectReason.loggedOut || statusCode === 401;
                const maxStrikesReached = currentAttempts >= 3;

                const shouldReconnect = !isUnauthorized && !maxStrikesReached && statusCode !== DisconnectReason.forbidden;

                logger.warn(`WhatsApp connection closed for ${userId}`, { statusCode, shouldReconnect, attempt: currentAttempts });
                this.clients.delete(userId);

                if (shouldReconnect) {
                    const delay = Math.min(5000 * Math.pow(2, currentAttempts - 1), 30000);
                    const timer = setTimeout(() => this.startSession(userId), delay);
                    this.reconnectTimers.set(userId, timer);
                    await User.findByIdAndUpdate(userId, { whatsappStatus: 'connecting' });
                } else {
                    // Critical failure or intentionally logged out
                    await deleteSession(userId);
                    this.reconnectAttempts.delete(userId);
                    await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
                    const channel = `${QR_CHANNEL_PREFIX}${userId}`;
                    const reason = maxStrikesReached ? 'Max reconnection attempts reached' : (isUnauthorized ? 'Session unauthorized' : 'Connection failed permanently');
                    await redis.publish(channel, JSON.stringify({ type: 'error', message: reason }));
                }
            }
        });

        // Autocleanup polling: If session stays in 'connecting' for 2 mins, something is wrong
        setTimeout(() => {
            if (this.sessionStatus.get(userId) === 'connecting') {
                logger.warn(`Session for ${userId} stuck in connecting for 2 mins, cleaning up...`);
                this.stopSession(userId);
            }
        }, 120000);
    }

    async stopSession(userId: string): Promise<void> {
        const sock = this.clients.get(userId);
        if (sock) {
            await sock.logout();
            this.clients.delete(userId);
        }
        const timer = this.reconnectTimers.get(userId);
        if (timer) clearTimeout(timer);
        this.reconnectTimers.delete(userId);

        await deleteSession(userId);
        await User.findByIdAndUpdate(userId, { whatsappStatus: 'disconnected' });
        logger.info(`Session stopped for user ${userId}`);
    }

    async sendMessage(userId: string, phone: string, text: string): Promise<void> {
        const attempts = 3;
        let lastError: any;

        for (let i = 0; i < attempts; i++) {
            try {
                let sock = this.clients.get(userId);
                let status = this.sessionStatus.get(userId);

                if (!sock) {
                    throw new Error(`No active WhatsApp session for user ${userId}`);
                }

                if (status === 'connecting') {
                    logger.info(`Session for ${userId} is connecting, waiting 3s (Attempt ${i + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    status = this.sessionStatus.get(userId);
                    sock = this.clients.get(userId);
                }

                if (!sock || status !== 'open') {
                    throw new Error(`WhatsApp session is not ready (status: ${status})`);
                }

                const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
                logger.info(`Sending WhatsApp message to ${jid} (Attempt ${i + 1})`);
                await sock.sendMessage(jid, { text });
                return; // Success!
            } catch (err: any) {
                lastError = err;
                logger.warn(`Failed to send message (Attempt ${i + 1}/${attempts}): ${err.message}`);

                // If it's a "session closed" or similar error, maybe we should wait a bit longer
                if (i < attempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        throw lastError;
    }

    getStatus(userId: string): 'connecting' | 'connected' | 'disconnected' | null {
        const status = this.sessionStatus.get(userId);
        if (status === 'open') return 'connected';
        if (status === 'connecting') return 'connecting';
        if (status === 'closed') return 'disconnected';
        return null;
    }
}

// Singleton instance shared across the app
export const clientManager = new ClientManager();
