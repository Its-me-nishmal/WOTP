export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    plan: 'free' | 'pro';
    usageCount: number;
    usageLimit: number;
    dailyOtpCount?: number;
    dailyMessageCount?: number;
    messageUsageCount?: number;
    lastDailyResetAt?: string;
    whatsappStatus: 'disconnected' | 'connecting' | 'connected';
    createdAt: string;
}

export interface ApiKey {
    id: string;
    _id: string;
    name: string;
    prefix: string;
    key?: string; // Only available once upon creation
    isActive: boolean;
    lastUsedAt?: string;
    createdAt: string;
}

export interface WhatsAppNumber {
    id: string;
    sessionId: string;
    number?: string;
    phone?: string;
    name?: string;
    status: 'connected' | 'disconnected' | 'connecting';
    qrCode?: string;
}

export interface LogEntry {
    id: string;
    phone: string;
    status: 'pending' | 'delivered' | 'failed' | 'verified';
    apiKeyName: string;
    failReason?: string;
    createdAt: string;
}

export interface DashboardStats {
    totalSent: number;
    totalVerified: number;
    totalMessages?: number;
    activeKeys: number;
    remainingOtps: number;
    remainingMessages?: number;
    planLimit: number;
    msgLimit?: number;
}
