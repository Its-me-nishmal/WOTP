/**
 * whatsapp.service.ts
 * Thin façade over ClientManager — keeps controllers clean.
 * Now delegates to the real Baileys implementation.
 */
import { clientManager } from './whatsapp/ClientManager';
import { logger } from '../utils/logger';

class WhatsAppService {
  async connect(userId: string, sessionId: string = 'default'): Promise<void> {
    logger.info(`[WhatsApp] Starting session for user ${userId} (session: ${sessionId})`);
    clientManager.startSession(userId, sessionId).catch((err) =>
      logger.error(`[WhatsApp] startSession error for ${userId}:${sessionId}`, err)
    );
  }

  async disconnect(userId: string, sessionId: string = 'default'): Promise<void> {
    await clientManager.stopSession(userId, sessionId);
  }

  getStatus(userId: string, sessionId: string = 'default'): 'connecting' | 'connected' | 'disconnected' | null {
    return clientManager.getStatus(userId, sessionId);
  }

  async sendMessage(userId: string, phone: string, message: string, sessionId: string = 'default'): Promise<boolean> {
    try {
      await clientManager.sendMessage(userId, phone, message, sessionId);
      return true;
    } catch (err) {
      logger.error(`[WhatsApp] sendMessage failed for ${userId}:${sessionId}`, err);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
