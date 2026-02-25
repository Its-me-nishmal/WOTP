import { useState, useEffect } from 'react';
import { Send, Terminal, Loader2, RefreshCw, Key, Database, Globe, Smartphone } from 'lucide-react';
import { apiKeysApi, messagingApi, whatsappApi } from '../../services/api';
import type { ApiKey, WhatsAppNumber } from '../../types';
import { useToast } from '../../hooks/useToast';
import PhoneInput from '../ui/PhoneInput';

interface Props {
    onSuccess: () => void;
}

export default function AdvancedMessagingConsole({ onSuccess }: Props) {
    const { show } = useToast();
    const [connections, setConnections] = useState<WhatsAppNumber[]>([]);
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // Form State
    const [countryCode, setCountryCode] = useState('91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [content, setContent] = useState('');
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [sessionId, setSessionId] = useState('default');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [keysRes, wsRes] = await Promise.all([
                apiKeysApi.list(),
                whatsappApi.getStatus()
            ]);
            setKeys(keysRes);
            const active = wsRes.connections.filter(c => c.status === 'connected');
            setConnections(active);

            if (keysRes.length > 0) setSelectedApiKey(keysRes[0].key || '');
            if (active.length > 0) setSessionId(active[0].sessionId);
        } catch (err) {
            show('Failed to load configuration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullPhone = `+${countryCode}${phoneNumber}`;

        if (!phoneNumber) return show('Phone number required', 'error');
        if (!content) return show('Message content required', 'error');
        if (!selectedApiKey) return show('API Key required', 'error');

        setSending(true);
        try {
            await messagingApi.send({
                phone: fullPhone,
                content,
                apiKey: selectedApiKey,
                sessionId
            });
            show('Advanced message queued!', 'success');
            setContent('');
            onSuccess();
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const isReady = connections.length > 0 && keys.length > 0;

    return (
        <div className="card border-white/5 bg-card/50 overflow-hidden relative">
            <div className="card-header border-b border-white/5 flex justify-between items-center py-4 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-secondary" />
                    <h3 className="font-bold text-sm tracking-tight text-primary">ADVANCED MESSAGING CONSOLE</h3>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-secondary transition-colors"
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="card-body p-6">
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Configuration */}
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-secondary/60 mb-2 flex items-center gap-2">
                                    <Globe size={12} /> Target Recipient
                                </label>
                                <PhoneInput
                                    countryCode={countryCode}
                                    phoneNumber={phoneNumber}
                                    onCountryCodeChange={setCountryCode}
                                    onPhoneNumberChange={setPhoneNumber}
                                    disabled={sending}
                                />
                            </div>

                            <div className="form-group">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-secondary/60 mb-2 flex items-center gap-2">
                                    <Key size={12} /> Secret API Key
                                </label>
                                <select
                                    className="w-full bg-surface border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all font-mono"
                                    value={selectedApiKey}
                                    onChange={(e) => setSelectedApiKey(e.target.value)}
                                    disabled={sending || loading}
                                >
                                    <option value="">Select Key</option>
                                    {keys.map(k => (
                                        <option key={k.id} value={k.key}>{k.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-secondary/60 mb-2 flex items-center gap-2">
                                    <Database size={12} /> Sender Identity
                                </label>
                                <select
                                    className="w-full bg-surface border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    disabled={sending || loading}
                                >
                                    {connections.map(c => (
                                        <option key={c.sessionId} value={c.sessionId}>
                                            {c.name || 'Default Session'}
                                        </option>
                                    ))}
                                    {connections.length === 0 && <option value="default">No Active Sessions</option>}
                                </select>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <div className="form-group h-full flex flex-col">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-secondary/60 mb-2">
                                    Message Payload
                                </label>
                                <textarea
                                    className="flex-1 w-full bg-surface border border-white/5 rounded-xl p-4 text-sm focus:outline-none focus:border-accent transition-all resize-none min-h-[160px]"
                                    placeholder="Enter raw message content..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    disabled={sending}
                                />
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <span className="text-[10px] text-secondary/40 font-mono">UTF-8 / Raw</span>
                                    <span className="text-[10px] text-secondary/40 font-mono">{content.length} chars</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="submit"
                            className={`btn btn-lg flex-1 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${isReady ? 'btn-primary' : 'btn-secondary opacity-50'}`}
                            disabled={sending || !isReady}
                        >
                            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {(!isReady && !loading) ? 'SYSTEM NOT READY' : 'EXECUTE MESSAGE SEND'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Overlay for not connected */}
            {!isReady && !loading && connections.length === 0 && (
                <div className="absolute inset-0 bg-base/60 backdrop-blur-sm flex items-center justify-center z-10 p-8 text-center rounded-2xl">
                    <div className="max-w-xs">
                        <Smartphone size={40} className="mx-auto text-secondary/40 mb-4" />
                        <h4 className="font-bold mb-2">WhatsApp Disconnected</h4>
                        <p className="text-xs text-secondary leading-relaxed">
                            You need an active WhatsApp connection to use the playground.
                            Please connect a session first.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
