import mongoose, { Schema, Document } from 'mongoose';

export type OtpLogStatus = 'pending' | 'delivered' | 'failed' | 'verified';

export interface IOtpLog extends Document {
    userId: mongoose.Types.ObjectId;
    apiKeyId: mongoose.Types.ObjectId;
    phone: string;
    status: OtpLogStatus;
    failReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OtpLogSchema = new Schema<IOtpLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        apiKeyId: { type: Schema.Types.ObjectId, ref: 'ApiKey', required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'delivered', 'failed', 'verified'],
            default: 'pending',
        },
        failReason: { type: String },
    },
    { timestamps: true }
);

// TTL index — logs auto-expire after 90 days
OtpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const OtpLog = mongoose.model<IOtpLog>('OtpLog', OtpLogSchema);
