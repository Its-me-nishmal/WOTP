import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import apikeyRoutes from './routes/apikey.routes';
import otpRoutes from './routes/otp.routes';
import whatsappRoutes from './routes/whatsapp.routes';

import { getRedis } from './config/redis';

export const createApp = () => {
    const app = express();
    app.set('redis', getRedis());
    app.set('trust proxy', 1); // Trust first-hop proxy (e.g. Nginx, Cloudflare)


    // ── Security Middleware ─────────────────────────────────────────────────────
    app.use(helmet());
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));

    // ── Global Rate Limit ───────────────────────────────────────────────────────
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please slow down.' },
    }));

    // ── Body Parsing ────────────────────────────────────────────────────────────
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: false }));

    // ── Health Check ────────────────────────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ── Routes ──────────────────────────────────────────────────────────────────
    // ── Routes ──────────────────────────────────────────────────────────────────
    const apiRouter = express.Router();
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/user', userRoutes);
    apiRouter.use('/apikey', apikeyRoutes);
    apiRouter.use('/otp', otpRoutes);
    apiRouter.use('/whatsapp', whatsappRoutes);

    app.use('/api', apiRouter);

    // ── 404 Handler ─────────────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // ── Global Error Handler ────────────────────────────────────────────────────
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        logger.error('Unhandled error', { message: err.message, stack: err.stack });
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
};
