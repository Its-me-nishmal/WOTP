/**
 * whatsapp.service.ts
 * Thin façade over ClientManager — keeps controllers clean.
 * Now delegates to the real Baileys implementation.
 */
import { clientManager } from './whatsapp/ClientManager';
import { logger } from '../utils/logger';

class WhatsAppService {
  async connect(userId: string): Promise<void> {
    logger.info(`[WhatsApp] Starting session for user ${userId}`);
    // Session start is async (fires QR via Redis Pub/Sub).
    // Don't await — SSE endpoint subscribes simultaneously.
    clientManager.startSession(userId).catch((err) =>
      logger.error(`[WhatsApp] startSession error for ${userId}`, err)
    );
  }

  async disconnect(userId: string): Promise<void> {
    await clientManager.stopSession(userId);
  }

  getStatus(userId: string): 'connecting' | 'connected' | 'disconnected' | null {
    return clientManager.getStatus(userId);
  }

  async sendMessage(userId: string, phone: string, message: string): Promise<boolean> {
    try {
      await clientManager.sendMessage(userId, phone, message);
      return true;
    } catch (err) {
      logger.error(`[WhatsApp] sendMessage failed for ${userId}`, err);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
