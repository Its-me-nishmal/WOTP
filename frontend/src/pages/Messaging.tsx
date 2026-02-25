import { useState, useEffect } from 'react';
import { Send, Smartphone, History, Loader2, RefreshCw } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { messagingApi, messageLogsApi, apiKeysApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import type { ApiKey } from '../types';
import PremiumUpgradeModal from '../components/modals/PremiumUpgradeModal';

export default function Messaging() {
    const { user } = useAuth();
    const { show } = useToast();
    const [phone, setPhone] = useState('');
    const [content, setContent] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    useEffect(() => {
        apiKeysApi.list().then(setKeys);
        fetchLogs();
    }, []);

    const fetchLogs = () => {
        setLoadingLogs(true);
        messageLogsApi.list()
            .then(res => setLogs(res.logs))
            .finally(() => setLoadingLogs(false));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !content || !apiKey) return show('Please fill all fields', 'error');

        setSending(true);
        try {
            await messagingApi.send({ phone, content, apiKey });
            show('Message queued successfully', 'success');
            setContent('');
            setTimeout(fetchLogs, 2000);
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <AppLayout title="Direct Messaging">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Section */}
                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="flex items-center gap-2">
                                <Send size={18} className="text-accent" />
                                Send Transactional Message
                            </h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="form-group">
                                    <label>Recipient Phone Number</label>
                                    <div className="input-with-icon">
                                        <Smartphone size={16} />
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="+919876543210"
                                            required
                                        />
                                    </div>
                                    <p className="helper-text">Include country code (e.g. +91)</p>
                                </div>

                                <div className="form-group">
                                    <label>API Key</label>
                                    <select
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        className="w-full bg-surface border rounded-lg p-3 text-sm focus:outline-none focus:border-accent"
                                        required
                                    >
                                        <option value="">Select an API key</option>
                                        {keys.map(k => (
                                            <option key={k.id} value={k.key}>{k.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Message Content</label>
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        rows={4}
                                        placeholder="Hi! Your order #1234 has been shipped."
                                        maxLength={2048}
                                        required
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="helper-text">Markdown and emojis supported.</p>
                                        <span className="text-[10px] text-secondary font-mono">{content.length}/2048</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 mb-2">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-secondary">Monthly Quota</span>
                                        <span className="font-bold text-primary">
                                            {user?.plan === 'pro' ? 'Unlimited' : `${user?.messageUsageCount || 0}/250`}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent transition-all duration-1000"
                                            style={{ width: `${user?.plan === 'pro' ? 0 : Math.min(100, ((user?.messageUsageCount || 0) / 250) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full py-3"
                                    disabled={sending}
                                >
                                    {sending ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send size={18} className="mr-2" />}
                                    Send WhatsApp Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div>
                    <div className="card h-full">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="flex items-center gap-2">
                                <History size={18} className="text-accent" />
                                Recent Messages
                            </h3>
                            <button className="btn-icon" onClick={fetchLogs}>
                                <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="card-body p-0">
                            {loadingLogs ? (
                                <div className="p-12 text-center text-secondary">
                                    <Loader2 className="animate-spin mx-auto mb-4" />
                                    Loading history...
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="p-12 text-center text-secondary">
                                    <History size={32} className="mx-auto mb-4 opacity-20" />
                                    No records found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b bg-surface/50">
                                                <th className="p-4">Phone</th>
                                                <th className="p-4">Content</th>
                                                <th className="p-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map(log => (
                                                <tr key={log._id} className="border-b hover:bg-surface/30 transition-colors">
                                                    <td className="p-4 font-medium">{log.phone}</td>
                                                    <td className="p-4">
                                                        <div className="max-w-[200px] truncate text-secondary" title={log.content}>
                                                            {log.content}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`badge ${log.status === 'delivered' ? 'badge-green' : 'badge-orange'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PremiumUpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                featureName="Transactional Messaging API"
            />
        </AppLayout>
    );
}

