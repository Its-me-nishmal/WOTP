import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OtpLog } from '../models/OtpLog';
import { ApiKey } from '../models/ApiKey';
import { logger } from '../utils/logger';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        plan: user.plan,
        usageCount: user.usageCount,
        usageLimit: user.plan === 'pro' ? 10000 : 100,
        usageResetAt: user.usageResetAt,
        whatsappStatus: user.whatsappStatus,
        createdAt: user.createdAt,
    });
};

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id;
        const {
            status,
            phone,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = '1',
            limit = '20'
        } = req.query as {
            status?: string;
            phone?: string;
            startDate?: string;
            endDate?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
            page?: string;
            limit?: string;
        };

        const filter: Record<string, unknown> = { userId };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (phone) {
            filter.phone = { $regex: phone, $options: 'i' };
        }

        if (startDate || endDate) {
            const dateFilter: any = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
            filter.createdAt = dateFilter;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [logs, total] = await Promise.all([
            OtpLog.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('apiKeyId', 'name')
                .lean(),
            OtpLog.countDocuments(filter),
        ]);

        const mappedLogs = logs.map((log) => ({
            ...log,
            id: (log as any)._id,
            apiKeyName: (log as any).apiKeyId?.name || 'Dashboard'
        }));

        res.json({
            logs: mappedLogs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        logger.error('Get logs error', { err });
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id;
        const [totalSent, totalVerified, activeKeys] = await Promise.all([
            OtpLog.countDocuments({ userId, status: 'delivered' }),
            OtpLog.countDocuments({ userId, status: 'verified' }),
            ApiKey.countDocuments({ userId, isActive: true })
        ]);

        const planLimit = req.user!.plan === 'pro' ? 10000 : 100;
        const remainingOtps = Math.max(0, planLimit - req.user!.usageCount);

        res.json({
            totalSent,
            totalVerified,
            activeKeys,
            remainingOtps,
            planLimit
        });
    } catch (err) {
        logger.error('Get stats error', { err });
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
