/**
 * SessionStore.ts
 * MongoDB-backed Baileys AuthState implementation.
 * Stores all WhatsApp session credentials in MongoDB to avoid high Redis usage.
 */
import { AuthenticationState, BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import { Session } from '../../models/Session';
import { logger } from '../../utils/logger';

const KEY_MAP: Record<string, string> = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory',
};

export async function useMongoAuthState(
    userId: string,
    sessionId: string = 'default'
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {

    const writeData = async (data: unknown, dataType: string, dataId: string = 'default') => {
        try {
            await Session.findOneAndUpdate(
                { userId, sessionId, dataType, dataId },
                { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
                { upsert: true, returnDocument: 'after' }
            );
        } catch (err) {
            logger.error(`[AuthStore] Error writing data: ${dataType}`, err);
        }
    };

    const readData = async <T>(dataType: string, dataId: string = 'default'): Promise<T | null> => {
        try {
            const session = await Session.findOne({ userId, sessionId, dataType, dataId }).lean();
            if (!session) return null;
            return JSON.parse(JSON.stringify(session.data), BufferJSON.reviver) as T;
        } catch (err) {
            logger.error(`[AuthStore] Error reading data: ${dataType}`, err);
            return null;
        }
    };

    const removeData = async (dataType: string, dataId: string) => {
        try {
            await Session.deleteOne({ userId, sessionId, dataType, dataId });
        } catch (err) {
            logger.error(`[AuthStore] Error removing data: ${dataType}`, err);
        }
    };

    const creds = (await readData<AuthenticationState['creds']>('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: Record<string, any> = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            const val = await readData<any>((KEY_MAP as any)[type], id);
                            if (val) {
                                data[id] =
                                    type === 'app-state-sync-key' ? proto.Message.AppStateSyncKeyData.fromObject(val as object) : val;
                            }
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks: Promise<void>[] = [];
                    for (const type in data) {
                        const vals = data[type as keyof typeof data];
                        for (const id in vals) {
                            const val = vals[id];
                            const dataType = (KEY_MAP as any)[type];
                            if (val) {
                                tasks.push(writeData(val, dataType, id));
                            } else {
                                tasks.push(removeData(dataType, id));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        },
    };
}

export async function deleteSession(userId: string, sessionId: string = 'default'): Promise<void> {
    logger.info(`Cleaning up WhatsApp session for user ${userId} (session: ${sessionId}) in MongoDB`);
    await Session.deleteMany({ userId, sessionId });
}
