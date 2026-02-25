import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppConnection extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    phone?: string;
    name?: string;
    status: 'connected' | 'disconnected' | 'connecting';
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppConnectionSchema = new Schema<IWhatsAppConnection>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        sessionId: { type: String, required: true },
        phone: { type: String },
        name: { type: String },
        status: {
            type: String,
            enum: ['connected', 'disconnected', 'connecting'],
            default: 'connecting',
        },
    },
    { timestamps: true }
);

// Ensure one connection per sessionId for a user
WhatsAppConnectionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const WhatsAppConnection = mongoose.model<IWhatsAppConnection>('WhatsAppConnection', WhatsAppConnectionSchema);
