import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient>;
let redisOptions: any;

export const connectRedis = async () => {
    let url = (process.env.REDIS_URL || 'redis://localhost:6379').trim();

    // Forced TLS for Upstash
    if (url.includes('upstash.io') && url.startsWith('redis://')) {
        url = url.replace('redis://', 'rediss://');
    }

    logger.info(`Initializing Redis connection...`);

    const isSecure = url.startsWith('rediss://');

    redisOptions = {
        url,
        socket: isSecure ? {
            tls: true,
            rejectUnauthorized: false,
            reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000)
        } : {
            reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000)
        }
    };

    redisClient = createClient(redisOptions);

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect();

    // Verification check for BullMQ reliability
    try {
        const config = await redisClient.configGet('maxmemory-policy');
        const policy = config['maxmemory-policy'];
        if (policy !== 'noeviction') {
            logger.warn(`REDIS WARNING: Current policy is "${policy}". For BullMQ stability, "noeviction" is recommended.`);
        }
    } catch (e) {
        // configGet might be disabled on some managed services (like basic Upstash)
    }

    return redisClient;
};

export const getRedis = () => {
    if (!redisClient) throw new Error('Redis not initialized');
    return redisClient;
};

export const getRedisOptions = () => {
    if (!redisOptions) throw new Error('Redis options not initialized');
    return redisOptions;
};
