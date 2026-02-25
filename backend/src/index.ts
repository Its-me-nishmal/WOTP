import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { startOtpWorker } from './jobs/otp.queue';
import { startMessageWorker } from './jobs/message.queue';
import { User } from './models/User';
import { whatsappService } from './services/whatsapp.service';
import { logger } from './utils/logger';


const PORT = Number(process.env.PORT) || 5000;

const bootstrap = async () => {
    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Connect to Redis
        await connectRedis();

        // 3. Migration: Drop legacy session index if it exists
        try {
            const db = mongoose.connection.db;
            if (db) {
                const collections = await db.listCollections({ name: 'sessions' }).toArray();
                if (collections.length > 0) {
                    const indexes = await db.collection('sessions').indexes();
                    if (indexes.find(index => index.name === 'userId_1_dataType_1_dataId_1')) {
                        logger.info('Dropping legacy session index...');
                        await db.collection('sessions').dropIndex('userId_1_dataType_1_dataId_1');
                        logger.info('Legacy index dropped successfully');
                    }
                }
            }
        } catch (err) {
            logger.warn('Failed to drop legacy index (it might not exist or already be dropped)', err);
        }

        // 4. Start BullMQ OTP & Message workers
        startOtpWorker();
        startMessageWorker();
        logger.info('Workers started');

        // 4. Restore active WhatsApp sessions
        const activeUsers = await User.find({ whatsappStatus: { $in: ['connected', 'connecting'] } });
        for (const user of activeUsers) {
            whatsappService.connect(String(user._id));
        }
        logger.info(`Restored ${activeUsers.length} WhatsApp sessions`);


        // 5. Start HTTP server
        const app = createApp();
        app.listen(PORT, () => {
            logger.info(`WOTP backend running on http://localhost:${PORT}`);
        });

    } catch (error: any) {
        logger.error('Bootstrap failed', {
            message: error.message,
            stack: error.stack,
            error
        });
        process.exit(1);
    }
};

bootstrap();
