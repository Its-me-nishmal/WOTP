import { Queue, Worker, Job } from 'bullmq';
import { getRedisOptions } from '../config/redis';
import { whatsappService } from '../services/whatsapp.service';
import { MessageLog } from '../models/MessageLog';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface MessageJobData {
    userId: string;
    phone: string;
    content: string;
    apiKeyId: string;
    sessionId?: string;
}

let _queue: Queue<MessageJobData>;

export const getMessageQueue = (): Queue<MessageJobData> => {
    if (!_queue) {
        _queue = new Queue<MessageJobData>('message', {
            connection: getRedisOptions(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 3000 }, // Slightly longer backoff for general messages
                removeOnComplete: 100,
                removeOnFail: 200,
            },
        });
        logger.info('Message Queue initialized');
    }
    return _queue;
};

export const messageQueue = new Proxy({} as Queue<MessageJobData>, {
    get(_, prop) {
        return (getMessageQueue() as any)[prop].bind(getMessageQueue());
    },
});

export const startMessageWorker = () => {
    const worker = new Worker<MessageJobData>(
        'message',
        async (job: Job<MessageJobData>) => {
            const { userId, phone, content, apiKeyId, sessionId = 'default' } = job.data;
            logger.info(`Worker processing Transactional message job for ${phone} via ${sessionId}`, { jobId: job.id });

            try {
                // Auto-restore session if dropped
                const wsStatus = whatsappService.getStatus(userId, sessionId);
                if (wsStatus === 'disconnected') {
                    logger.info(`WhatsApp session ${sessionId} for ${userId} missing, attempting restore...`);
                    await whatsappService.connect(userId, sessionId).catch(() => { });

                    // Wait up to 5 seconds
                    for (let i = 0; i < 5; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        if (whatsappService.getStatus(userId, sessionId) === 'connected') break;
                    }
                }

                const sent = await whatsappService.sendMessage(userId, phone, content, sessionId);

                const status = sent ? 'delivered' : 'failed';
                const failReason = sent ? undefined : 'WhatsApp session not connected';

                await MessageLog.findOneAndUpdate(
                    {
                        userId: new mongoose.Types.ObjectId(userId),
                        phone,
                        status: 'pending',
                        content,
                    },
                    { status, failReason },
                    { sort: { createdAt: -1 } }
                );

                if (!sent) {
                    throw new Error(failReason);
                }

                logger.info(`Message delivered via WhatsApp to ${phone}`, { userId });
            } catch (err: any) {
                logger.error(`Error in Message worker for ${phone}:`, { err: err.message });

                await MessageLog.findOneAndUpdate(
                    {
                        userId: new mongoose.Types.ObjectId(userId),
                        phone,
                        status: 'pending',
                        content,
                    },
                    { status: 'failed', failReason: err.message },
                    { sort: { createdAt: -1 } }
                ).catch(() => { });

                throw err;
            }
        },
        {
            connection: getRedisOptions(),
            concurrency: 5, // Lower concurrency for general messages than OTPs
            drainDelay: 60,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 200 }
        }
    );

    worker.on('failed', (job, err) => {
        logger.error('Transactional message job failed', { jobId: job?.id, err: err.message });
    });

    return worker;
};
