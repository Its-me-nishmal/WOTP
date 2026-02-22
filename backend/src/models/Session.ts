import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    userId: string;
    dataType: string; // e.g., 'creds', 'preKeys', 'sessions'
    dataId: string;   // e.g., 'default', or actual ID for preKeys
    data: unknown;
    updatedAt: Date;
}

const SessionSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    dataType: { type: String, required: true },
    dataId: { type: String, required: true },
    data: { type: Schema.Types.Mixed }, // Buffer-friendly mixed type
}, {
    timestamps: true
});

// Compound index for fast lookups
SessionSchema.index({ userId: 1, dataType: 1, dataId: 1 }, { unique: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
