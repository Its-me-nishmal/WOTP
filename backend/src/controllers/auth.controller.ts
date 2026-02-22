import { Request, Response } from 'express';
import { verifyGoogleToken, findOrCreateUser, generateTokens, verifyRefreshToken, getOtpLimit } from '../services/auth.service';
import { ApiKey } from '../models/ApiKey';
import { generateApiKey } from '../services/otp.service';
import { logger } from '../utils/logger';

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body as { idToken?: string };
        if (!idToken) {
            res.status(400).json({ error: 'idToken is required' });
            return;
        }

        const profile = await verifyGoogleToken(idToken);
        const user = await findOrCreateUser(profile);
        const { accessToken, refreshToken } = generateTokens(String(user._id));
        const usageLimit = getOtpLimit(user.plan);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                plan: user.plan,
                usageCount: user.usageCount,
                usageLimit,
                whatsappStatus: user.whatsappStatus,
            },
        });
    } catch (err) {
        logger.error('Google login error', { err });
        res.status(401).json({ error: 'Google authentication failed' });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken: token } = req.body as { refreshToken?: string };
        if (!token) {
            res.status(400).json({ error: 'refreshToken is required' });
            return;
        }

        const decoded = verifyRefreshToken(token);
        const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);

        res.json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: 'Logged out successfully' });
};

export const devLogin = async (_req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Dev login not available in production' });
        return;
    }

    try {
        const user = await findOrCreateUser({
            googleId: 'dev_user_123',
            email: 'dev@example.com',
            name: 'Developer User',
            avatar: 'https://ui-avatars.com/api/?name=Developer+User&background=random',
        });

        const { accessToken, refreshToken } = generateTokens(String(user._id));
        const usageLimit = getOtpLimit(user.plan);

        // Ensure dev user has an API Key for testing
        const existingKey = await ApiKey.findOne({ userId: user._id });
        if (!existingKey) {
            const { hashedKey, prefix } = generateApiKey();
            await ApiKey.create({
                userId: user._id,
                name: 'Default Dev Key',
                key: hashedKey,
                prefix,
            });
            logger.info('Created default API key for dev user');
        }

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                plan: user.plan,
                usageCount: user.usageCount,
                usageLimit,
                whatsappStatus: user.whatsappStatus,
            },
        });
    } catch (err) {
        logger.error('Dev login error', { err });
        res.status(500).json({ error: 'Dev login failed' });
    }
};
