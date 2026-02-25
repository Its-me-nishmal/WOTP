import { useState, useEffect } from 'react';
import { Send, Smartphone, History, Loader2, RefreshCw } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { messagingApi, messageLogsApi, apiKeysApi, whatsappApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import type { ApiKey, WhatsAppNumber } from '../types';
import PremiumUpgradeModal from '../components/modals/PremiumUpgradeModal';

export default function Messaging() {
    const { user, refreshUser } = useAuth();
    const { show } = useToast();
    const [phone, setPhone] = useState('');
    const [content, setContent] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [sessionId, setSessionId] = useState('default');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [connections, setConnections] = useState<WhatsAppNumber[]>([]);
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    useEffect(() => {
        apiKeysApi.list().then(setKeys);
        whatsappApi.getStatus().then(res => {
            const active = res.connections.filter(c => c.status === 'connected');
            setConnections(active);
            if (active.length > 0 && !active.find(c => c.sessionId === 'default')) {
                setSessionId(active[0].sessionId);
            }
        });
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
        if (!phone || !content || !apiKey || !sessionId) return show('Please fill all fields', 'error');

        setSending(true);
        try {
            await messagingApi.send({ phone, content, apiKey, sessionId });
            show('Message queued successfully', 'success');
            setContent('');
            refreshUser();
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
                    <div className="card card-glow">
                        <div className="card-header border-b border-white/5">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <Send size={18} className="text-accent" />
                                Send Transactional Message
                            </h3>
                        </div>
                        <div className="card-body py-6">
                            <form onSubmit={handleSend} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="text-xs font-medium text-secondary mb-1.5 block">Sender WhatsApp</label>
                                        <select
                                            value={sessionId}
                                            onChange={e => setSessionId(e.target.value)}
                                            className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-colors"
                                            required
                                        >
                                            <option value="">Select account</option>
                                            {connections.map(c => (
                                                <option key={c.sessionId} value={c.sessionId}>
                                                    {c.name || c.sessionId} ({c.phone || 'No number'})
                                                </option>
                                            ))}
                                            {connections.length === 0 && (
                                                <option disabled>No connected clients</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-medium text-secondary mb-1.5 block">API Key (Auth)</label>
                                        <select
                                            value={apiKey}
                                            onChange={e => setApiKey(e.target.value)}
                                            className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-colors"
                                            required
                                        >
                                            <option value="">Select key</option>
                                            {keys.map(k => (
                                                <option key={k.id} value={k.key}>{k.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="text-xs font-medium text-secondary mb-1.5 block">Recipient Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                                            <Smartphone size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full bg-surface/50 border border-white/10 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-accent transition-colors"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="+919876543210"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-secondary mt-1 ml-1 opacity-70">Include country code (e.g. +91)</p>
                                </div>

                                <div className="form-group">
                                    <label className="text-xs font-medium text-secondary mb-1.5 block">Message Content</label>
                                    <textarea
                                        className="w-full bg-surface/50 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        rows={4}
                                        placeholder="Hi! Your order #1234 has been shipped."
                                        maxLength={2048}
                                        required
                                    />
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <p className="text-[10px] text-secondary italic opacity-70">Markdown and emojis supported.</p>
                                        <span className={`text-[10px] font-mono ${content.length > 1900 ? 'text-orange-400' : 'text-secondary'}`}>
                                            {content.length}/2048
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                    <div className="flex justify-between items-center text-[11px] mb-2 px-1">
                                        <span className="text-secondary">Monthly Quota</span>
                                        <span className="font-bold text-accent">
                                            {user?.plan === 'pro' ? 'Unlimited' : `${user?.messageUsageCount || 0} / 250`}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] transition-all duration-1000"
                                            style={{ width: `${user?.plan === 'pro' ? 0 : Math.min(100, ((user?.messageUsageCount || 0) / 250) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full py-3.5 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 font-semibold"
                                    disabled={sending || connections.length === 0}
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    {connections.length === 0 ? 'Connect WhatsApp First' : 'Send WhatsApp Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="card h-full flex flex-col overflow-hidden">
                        <div className="card-header border-b border-white/5 flex justify-between items-center py-4">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <History size={18} className="text-accent" />
                                Recent Messages
                            </h3>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-secondary" onClick={fetchLogs}>
                                <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="card-body p-0 flex-1 overflow-auto">
                            {loadingLogs && logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-secondary">
                                    <Loader2 className="animate-spin mb-3 opacity-50" size={24} />
                                    <span className="text-xs">Loading history...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-secondary opacity-30">
                                    <History size={40} className="mb-4" />
                                    <span className="text-sm">No records found</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {logs.map(log => (
                                        <div key={log._id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-xs font-semibold text-primary">{log.phone}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                                    log.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary line-clamp-2 pr-4">{log.content}</p>
                                            <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-secondary/60">
                                                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                                <span className="text-[10px] text-accent/60 font-medium">via {log.apiKeyId?.name || 'API'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PremiumUpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                featureName="Multi-Client Sending"
            />
        </AppLayout>
    );
}
