import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    userId: string;
    sessionId: string; // e.g., 'default', 'work', 'personal'
    dataType: string; // e.g., 'creds', 'preKeys', 'sessions'
    dataId: string;   // e.g., 'default', or actual ID for preKeys
    data: unknown;
    updatedAt: Date;
}

const SessionSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, default: 'default' },
    dataType: { type: String, required: true },
    dataId: { type: String, required: true },
    data: { type: Schema.Types.Mixed }, // Buffer-friendly mixed type
}, {
    timestamps: true
});

// Compound index for fast lookups - updated for multi-session
SessionSchema.index({ userId: 1, sessionId: 1, dataType: 1, dataId: 1 }, { unique: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
