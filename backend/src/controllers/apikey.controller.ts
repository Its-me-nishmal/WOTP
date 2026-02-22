import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { ApiKey } from '../models/ApiKey';
import { generateApiKey, hashApiKey } from '../services/otp.service';
import { logger } from '../utils/logger';

const createKeySchema = z.object({
    name: z.string().min(1).max(64),
});

export const createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = createKeySchema.parse(req.body);
        const userId = req.user!._id;

        const { rawKey, hashedKey, prefix } = generateApiKey();

        const newKey = await ApiKey.create({
            userId,
            name,
            key: hashedKey,
            rawKey,
            prefix,
            isActive: true,
        });

        logger.info('API key created', { userId, name, prefix });

        res.status(201).json({
            message: 'API key created successfully.',
            apiKey: rawKey,
            ...newKey.toObject(),
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        logger.error('Create API key error', { err });
        res.status(500).json({ error: 'Failed to create API key' });
    }
};

export const listApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
    // Return all keys including rawKey for owner visibility
    const keys = await ApiKey.find({ userId: req.user!._id }).lean();
    res.json({ keys });
};

export const deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await ApiKey.findOneAndDelete({ _id: id, userId: req.user!._id });

    if (!result) {
        res.status(404).json({ error: 'API key not found' });
        return;
    }

    logger.info('API key deleted', { id, userId: req.user!._id });
    res.json({ message: 'API key deleted' });
};
