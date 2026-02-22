import { Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AuthRequest } from './auth';

export const validate =
    (schema: ZodSchema) =>
        (req: AuthRequest, res: Response, next: NextFunction): void => {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: result.error.flatten().fieldErrors,
                });
                return;
            }
            req.body = result.data;
            next();
        };

// Shared schemas
export const sendOtpSchema = z.object({
    phone: z
        .string()
        .min(10)
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 expected)'),
});

export const verifyOtpSchema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const createApiKeySchema = z.object({
    name: z.string().min(1).max(50),
});
