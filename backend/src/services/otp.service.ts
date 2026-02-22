import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRedis } from '../config/redis';
import { User } from '../models/User';
import { OtpLog } from '../models/OtpLog';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const DEFAULT_OTP_TTL = 5 * 60; // 5 minutes

/**
 * Generates an OTP with custom parameters, hashes it, stores it in Redis,
 * enforces plan quotas, logs the attempt, and returns the OTP.
 */
export const generateAndStoreOtp = async (
    userId: string,
    apiKeyId: string,
    phone: string,
    plan: 'free' | 'pro',
    usageCount: number,
    options: {
        length?: number;
        type?: 'numeric' | 'alphanumeric' | 'alpha';
        expiresIn?: number;
    } = {}
): Promise<string> => {
    const limit = plan === 'pro' ? 10000 : 100;
    if (usageCount >= limit) {
        throw new Error(`Monthly OTP quota exceeded (${limit} for ${plan} plan)`);
    }

    const { length = 6, type = 'numeric', expiresIn = DEFAULT_OTP_TTL } = options;

    // Generate OTP based on type
    let otp = '';
    const charset = {
        numeric: '0123456789',
        alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }[type];

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        otp += charset.charAt(randomIndex);
    }

    // Hash the OTP before storing
    const hash = await bcrypt.hash(otp.toUpperCase(), 10);

    // Store in Redis with TTL: key = otp:{userId}:{phone}
    const redis = getRedis();
    const redisKey = `otp:${userId}:${phone}`;
    await redis.setEx(redisKey, expiresIn, hash);

    // Increment monthly usage
    await User.findByIdAndUpdate(userId, { $inc: { usageCount: 1 } });

    // Create pending log
    await OtpLog.create({
        userId: new mongoose.Types.ObjectId(userId),
        apiKeyId: new mongoose.Types.ObjectId(apiKeyId),
        phone,
        status: 'pending',
    });

    logger.info('OTP generated', { userId, phone, length, type, expiresIn });
    return otp;
};

/**
 * Verifies an OTP submitted by the caller against the Redis-stored hash.
 */
export const verifyOtp = async (
    userId: string,
    phone: string,
    otpInput: string
): Promise<boolean> => {
    const redis = getRedis();
    const redisKey = `otp:${userId}:${phone}`;
    const hash = await redis.get(redisKey);

    if (!hash) {
        return false; // expired or never sent
    }

    const isMatch = await bcrypt.compare(otpInput.toUpperCase(), hash);

    if (isMatch) {
        await redis.del(redisKey);
        // Update most recent matching log to 'verified'
        await OtpLog.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId), phone, status: { $in: ['pending', 'delivered'] } },
            { status: 'verified' },
            { sort: { createdAt: -1 } }
        );
        logger.info('OTP verified', { userId, phone });
    }

    return isMatch;
};

/**
 * Generate a secure API key. Returns { rawKey, hashedKey, prefix }.
 * Only rawKey is returned once to the user — hashedKey is stored.
 */
export const generateApiKey = (): { rawKey: string; hashedKey: string; prefix: string } => {
    const rawKey = `wk_${uuidv4().replace(/-/g, '')}`;
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.slice(0, 12); // e.g. "wk_a1b2c3d4e5"
    return { rawKey, hashedKey, prefix };
};

/**
 * Verify an API key against stored hashes.
 */
export const hashApiKey = (rawKey: string): string =>
    crypto.createHash('sha256').update(rawKey).digest('hex');
