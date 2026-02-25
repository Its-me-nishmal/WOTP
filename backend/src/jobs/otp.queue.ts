import { Queue, Worker, Job } from 'bullmq';
import { getRedisOptions } from '../config/redis';
import { whatsappService } from '../services/whatsapp.service';
import { OtpLog } from '../models/OtpLog';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface OtpJobData {
    userId: string;
    phone: string;
    otp: string;
    apiKeyId: string;
    sessionId?: string;
    message?: string;
}

let _queue: Queue<OtpJobData>;

export const getOtpQueue = (): Queue<OtpJobData> => {
    if (!_queue) {
        _queue = new Queue<OtpJobData>('otp', {
            connection: getRedisOptions(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 200,
            },
        });
        logger.info('OTP Queue initialized');
    }
    return _queue;
};

export const otpQueue = new Proxy({} as Queue<OtpJobData>, {
    get(_, prop) {
        return (getOtpQueue() as any)[prop].bind(getOtpQueue());
    },
});

export const startOtpWorker = () => {
    const worker = new Worker<OtpJobData>(
        'otp',
        async (job: Job<OtpJobData>) => {
            const { userId, phone, otp, apiKeyId, message: customMessage, sessionId = 'default' } = job.data;
            logger.info(`Worker processing OTP job for ${phone} via ${sessionId}`, { jobId: job.id });

            try {
                // Auto-restore session if it dropped but creds exist
                const wsStatus = whatsappService.getStatus(userId, sessionId);
                if (wsStatus === 'disconnected') {
                    logger.info(`WhatsApp session ${sessionId} for ${userId} is missing, attempting to restore...`);
                    await whatsappService.connect(userId, sessionId);

                    // Wait up to 8 seconds for Baileys to initialize
                    for (let i = 0; i < 8; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        if (whatsappService.getStatus(userId, sessionId) === 'connected') break;
                    }
                }

                let message = `Your WOTP verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`;

                if (customMessage) {
                    message = customMessage.replace(/{{otp}}/g, otp);
                }

                const sent = await whatsappService.sendMessage(userId, phone, message, sessionId);

                const status = sent ? 'delivered' : 'failed';
                const failReason = sent ? undefined : `WhatsApp session ${sessionId} not connected`;

                if (!sent) {
                    logger.warn(`OTP sending failed for ${phone}: ${failReason}`);
                }

                await OtpLog.findOneAndUpdate(
                    {
                        userId: new mongoose.Types.ObjectId(userId),
                        phone,
                        status: 'pending',
                    },
                    { status, failReason },
                    { sort: { createdAt: -1 } }
                );

                if (!sent) {
                    throw new Error(failReason);
                }

                logger.info(`OTP delivered via WhatsApp to ${phone}`, { userId });
            } catch (err: any) {
                logger.error(`Error in OTP worker for ${phone}:`, { err: err.message });

                // Final attempt to mark as failed if it hasn't been updated
                await OtpLog.findOneAndUpdate(
                    {
                        userId: new mongoose.Types.ObjectId(userId),
                        phone,
                        status: 'pending',
                    },
                    { status: 'failed', failReason: err.message },
                    { sort: { createdAt: -1 } }
                ).catch(() => { });

                throw err; // Re-throw for BullMQ retry
            }
        },
        {
            connection: getRedisOptions(),
            concurrency: 10,
            drainDelay: 60, // Poll less frequently when empty (reduced Upstash commands)
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 200 }
        }
    );

    worker.on('failed', (job, err) => {
        logger.error('OTP job failed', { jobId: job?.id, err: err.message });
    });

    return worker;
};
