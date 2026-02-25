import mongoose, { Schema, Document } from 'mongoose';

export type MessageLogStatus = 'pending' | 'delivered' | 'failed';

export interface IMessageLog extends Document {
    userId: mongoose.Types.ObjectId;
    apiKeyId: mongoose.Types.ObjectId;
    phone: string;
    content: string;
    status: MessageLogStatus;
    failReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageLogSchema = new Schema<IMessageLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        apiKeyId: { type: Schema.Types.ObjectId, ref: 'ApiKey', required: true },
        phone: { type: String, required: true },
        content: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'delivered', 'failed'],
            default: 'pending',
        },
        failReason: { type: String },
    },
    { timestamps: true }
);

// TTL index — logs auto-expire after 90 days
MessageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const MessageLog = mongoose.model<IMessageLog>('MessageLog', MessageLogSchema);
