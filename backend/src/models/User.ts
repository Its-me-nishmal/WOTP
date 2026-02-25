import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    plan: 'free' | 'pro';
    usageCount: number; // Total monthly OTPs
    usageResetAt: Date;
    dailyOtpCount: number;
    dailyMessageCount: number;
    messageUsageCount: number; // Monthly general messages
    lastDailyResetAt: Date;
    whatsappStatus: 'disconnected' | 'connecting' | 'connected';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        googleId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        avatar: { type: String },
        plan: { type: String, enum: ['free', 'pro'], default: 'free' },
        usageCount: { type: Number, default: 0 },
        usageResetAt: { type: Date, default: () => new Date() },
        dailyOtpCount: { type: Number, default: 0 },
        dailyMessageCount: { type: Number, default: 0 },
        messageUsageCount: { type: Number, default: 0 },
        lastDailyResetAt: { type: Date, default: () => new Date() },
        whatsappStatus: {
            type: String,
            enum: ['disconnected', 'connecting', 'connected'],
            default: 'disconnected',
        },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
