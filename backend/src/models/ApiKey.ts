import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    key: string; // hashed
    prefix: string; // first 8 chars for display
    isActive: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true },
        key: { type: String, required: true },
        prefix: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        lastUsedAt: { type: Date },
    },
    { timestamps: true }
);

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
