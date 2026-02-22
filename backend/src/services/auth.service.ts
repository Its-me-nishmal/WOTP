import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken: string): Promise<{
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}> => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email || !payload.name) {
        throw new Error('Invalid Google token payload');
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
    };
};

export const findOrCreateUser = async (profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}): Promise<IUser> => {
    // 1. Try to find by googleId
    let user = await User.findOne({ googleId: profile.googleId });

    if (!user) {
        // 2. If not found by googleId, try to find by email (Account Linking)
        user = await User.findOne({ email: profile.email });

        if (user) {
            // Link existing account with new googleId
            user.googleId = profile.googleId;
            if (profile.avatar) user.avatar = profile.avatar;
            user.name = profile.name;
            await user.save();
            logger.info('Linked existing user with new Google ID', { email: profile.email });
        } else {
            // 3. Create new user if no match found
            user = await User.create({
                googleId: profile.googleId,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
                plan: 'free',
                usageCount: 0,
                usageResetAt: new Date(),
                whatsappStatus: 'disconnected',
            });
            logger.info('New user created', { email: profile.email });
        }
    } else {
        // Update profile info if it changed
        let changed = false;
        if (user.name !== profile.name) { user.name = profile.name; changed = true; }
        if (profile.avatar && user.avatar !== profile.avatar) { user.avatar = profile.avatar; changed = true; }
        if (changed) await user.save();
    }

    return user;
};

export const generateTokens = (userId: string) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
    );

    return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};

export const getOtpLimit = (plan: 'free' | 'pro'): number =>
    plan === 'pro' ? 10000 : 100;
