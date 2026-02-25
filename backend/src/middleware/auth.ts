import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { ApiKey } from '../models/ApiKey';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    } catch (err) {
        logger.warn('JWT verification failed', { err });
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware: authenticate via API key (Bearer wk_...).
 * Resolves the owner user and attaches to req.user.
 * Used for SDK endpoints like GET /user/usage.
 */
export const authenticateApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'API key required' });
        return;
    }

    const rawKey = authHeader.split(' ')[1];
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    try {
        const apiKey = await ApiKey.findOne({
            $or: [{ key: hashedKey }, { key: rawKey }],
            isActive: true,
        }).populate('userId');

        if (!apiKey) {
            res.status(401).json({ error: 'Invalid or revoked API key' });
            return;
        }

        req.user = apiKey.userId as unknown as IUser;
        next();
    } catch (err) {
        logger.error('API key auth failed', { err });
        res.status(500).json({ error: 'Authentication error' });
    }
};
