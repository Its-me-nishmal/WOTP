import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import CopyField from '../components/ui/CopyField';
import { apiKeysApi } from '../services/api';
import type { ApiKey } from '../types';
import { useToast } from '../hooks/useToast';

export default function ApiKeys() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { show } = useToast();

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = () => {
        setLoading(true);
        apiKeysApi.list()
            .then(setKeys)
            .catch(() => show('Failed to load keys', 'error'))
            .finally(() => setLoading(false));
    };

    const handleCreate = async () => {
        const name = prompt('Enter a name for this API Key (e.g. "Staging App")');
        if (!name) return;

        try {
            const newKey = await apiKeysApi.create(name);
            setKeys(curr => [newKey, ...curr]);
            show('API Key created successfully');
        } catch (err: any) {
            show(err.message, 'error');
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await apiKeysApi.revoke(id);
            setKeys(curr => curr.filter(k => k.id !== id));
            show('API Key revoked');
        } catch (err: any) {
            show(err.message, 'error');
        }
    };

    return (
        <AppLayout
            title="API Keys"
            actions={
                <button className="btn btn-primary btn-sm" onClick={handleCreate}>
                    <Plus size={16} /> Create New Key
                </button>
            }
        >
            <div className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>API Key</th>
                                <th>Created</th>
                                <th>Last Used</th>
                                <th>Requests</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td>
                                </tr>
                            ) : keys.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-state">
                                        No API keys found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                keys.map(key => (
                                    <tr key={key.id}>
                                        <td className="font-semibold">{key.name}</td>
                                        <td style={{ width: 220 }}>
                                            <CopyField
                                                value={key.key || key.prefix}
                                                masked={!key.key}
                                            />
                                        </td>
                                        <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                                        <td>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <span className="badge badge-gray">Active</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn-danger btn-icon"
                                                onClick={() => handleRevoke(key.id)}
                                                title="Revoke Key"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
