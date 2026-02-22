import api from '../lib/api';
import type { User, ApiKey, LogEntry, WhatsAppNumber, DashboardStats } from '../types';
import type { AxiosResponse } from 'axios';

const unwrap = <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => promise.then(res => res.data);

export const authApi = {
    googleLogin: (idToken: string) =>
        unwrap(api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/google', { idToken })),

    devLogin: () =>
        unwrap(api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/dev-login')),

    refreshToken: (token: string) =>
        unwrap(api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken: token })),

    logout: () => unwrap(api.post('/auth/logout')),

    getMe: () => unwrap(api.get<User>('/user/me')),
};

export const dashboardApi = {
    getStats: () => unwrap(api.get<DashboardStats>('/user/stats')),
};

export const apiKeysApi = {
    list: () => unwrap(api.get<{ keys: (ApiKey & { _id: string; rawKey: string })[] }>('/apikey/list'))
        .then(data => data.keys.map(k => ({ ...k, id: k._id, key: k.rawKey }))), // map _id -> id, rawKey -> key
    create: (name: string) => unwrap(api.post<ApiKey & { apiKey: string; rawKey: string }>('/apikey/create', { name }))
        .then(k => ({ ...k, id: k._id, key: k.rawKey || k.apiKey })), // map _id -> id, rawKey/apiKey -> key
    revoke: (id: string) => unwrap(api.delete(`/apikey/${id}`)),
};

export const whatsappApi = {
    connect: () => unwrap(api.post<{ qrCode?: string; message?: string }>('/whatsapp/connect')),
    disconnect: () => unwrap(api.delete('/whatsapp/disconnect')),
    getStatus: () => unwrap(api.get<{ status: WhatsAppNumber['status'] }>('/whatsapp/status')),
};

export const logsApi = {
    list: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        phone?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) =>
        unwrap(api.get<{ logs: LogEntry[]; total: number; page: number; limit: number; totalPages: number }>('/user/logs', { params })),
};

export const otpApi = {
    send: (params: {
        phone: string;
        apiKey: string;
        length?: number;
        type?: 'numeric' | 'alphanumeric' | 'alpha';
        expiresIn?: number;
        message?: string;
    }) =>
        unwrap(api.post('/otp/send',
            {
                phone: params.phone,
                length: params.length,
                type: params.type,
                expiresIn: params.expiresIn,
                message: params.message
            },
            { headers: { Authorization: `Bearer ${params.apiKey}` } }
        )),

    verify: (phone: string, otp: string, apiKey: string) =>
        unwrap(api.post('/otp/verify', { phone, otp }, { headers: { Authorization: `Bearer ${apiKey}` } })),

    sendTest: (params: {
        phone: string;
        apiKeyId?: string;
        length?: number;
        type?: 'numeric' | 'alphanumeric' | 'alpha';
        expiresIn?: number;
        message?: string;
    }) =>
        unwrap(api.post('/otp/test', params)),

    verifyTest: (phone: string, otp: string) =>
        unwrap(api.post<{ success: boolean; message: string }>('/otp/test-verify', { phone, otp })),
};
