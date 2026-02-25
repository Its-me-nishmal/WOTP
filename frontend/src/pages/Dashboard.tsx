import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Smartphone, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import UsageBar from '../components/ui/UsageBar';
import { dashboardApi, otpApi, whatsappApi, messagingApi, apiKeysApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, ApiKey, WhatsAppNumber } from '../types';
import { useToast } from '../hooks/useToast';

export default function Dashboard() {
    const { show } = useToast();
    const { user, refreshUser } = useAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [connections, setConnections] = useState<WhatsAppNumber[]>([]);
    const [loading, setLoading] = useState(true);

    // Test Console State (OTP)
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [mode, setMode] = useState<'send' | 'verify'>('send');
    const [sending, setSending] = useState(false);

    // Quick Message State
    const [msgPhone, setMsgPhone] = useState('');
    const [msgContent, setMsgContent] = useState('');
    const [msgApiKey, setMsgApiKey] = useState('');
    const [msgSessionId, setMsgSessionId] = useState('default');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [sendingMsg, setSendingMsg] = useState(false);

    const isWhatsAppConnected = connections.some(c => c.status === 'connected');

    useEffect(() => {
        loadData();
        apiKeysApi.list().then(setKeys);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, wsRes] = await Promise.all([
                dashboardApi.getStats(),
                whatsappApi.getStatus()
            ]);
            setStats(statsRes);
            const active = wsRes.connections.filter(c => c.status === 'connected');
            setConnections(active);
            if (active.length > 0 && !active.find(c => c.sessionId === 'default')) {
                setMsgSessionId(active[0].sessionId);
            }
        } catch (err) {
            show('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        try {
            setSending(true);
            await otpApi.sendTest({ phone });
            setMode('verify');
            show('OTP Sent via WhatsApp!', 'success');
            loadData();
            refreshUser();
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setSending(true);
            const res = await otpApi.verifyTest(phone, otp);
            if (res.success) {
                show('Verification Successful!', 'success');
                setMode('send');
                setOtp('');
                setPhone('');
                loadData();
                refreshUser();
            } else {
                show(res.message || 'Invalid OTP', 'error');
            }
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgPhone || !msgContent || !msgApiKey || !msgSessionId) return show('Please fill all fields', 'error');

        setSendingMsg(true);
        try {
            await messagingApi.send({
                phone: msgPhone,
                content: msgContent,
                apiKey: msgApiKey,
                sessionId: msgSessionId
            });
            show('Message queued successfully', 'success');
            setMsgContent('');
            setMsgPhone('');
            loadData();
            refreshUser();
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading && !stats) return <AppLayout title="Dashboard">Loading...</AppLayout>;

    return (
        <AppLayout title="Dashboard">
            {/* Stats Grid */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><Activity size={20} /></div>
                    <div className="stat-label">OTPs Sent</div>
                    <div className="stat-value">{stats?.totalSent ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><Send size={20} /></div>
                    <div className="stat-label">Messages Sent</div>
                    <div className="stat-value">{stats?.totalMessages ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={20} /></div>
                    <div className="stat-label">Verified</div>
                    <div className="stat-value">{stats?.totalVerified ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><AlertTriangle size={20} /></div>
                    <div className="stat-label">Inactive Keys</div>
                    <div className="stat-value">{stats?.activeKeys ?? 0}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Usage Card */}
                <div className="card h-fit">
                    <div className="card-header">
                        <h3 className="font-semibold">Plan Usage</h3>
                    </div>
                    <div className="card-body">
                        <UsageBar
                            label="Monthly OTP Limit"
                            value={stats ? (stats.planLimit - stats.remainingOtps) : 0}
                            max={stats?.planLimit ?? 100}
                        />

                        <div style={{ marginTop: 24 }}>
                            <UsageBar
                                label="Monthly Message Quota"
                                value={user?.messageUsageCount || 0}
                                max={user?.plan === 'pro' ? 50000 : 250}
                            />
                        </div>

                        <div className="mt-4 text-[11px] text-secondary opacity-60 italic">
                            Plan resets on <strong>1st of every month</strong>.
                        </div>
                        <Link to="/settings" className="btn btn-secondary w-full no-underline flex items-center justify-center mt-6">
                            Upgrade Plan
                        </Link>
                    </div>
                </div>

                {/* Quick Message Card */}
                <div className="card lg:col-span-2">
                    <div className="card-header border-b border-white/5 flex justify-between items-center">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <Send size={18} className="text-accent" />
                            Quick Direct Message
                        </h3>
                        <Link to="/messaging" className="text-xs text-accent hover:underline no-underline">View History →</Link>
                    </div>
                    <div className="card-body py-4">
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-[10px] font-medium text-secondary mb-1 block">Sender WhatsApp</label>
                                    <select
                                        value={msgSessionId}
                                        onChange={e => setMsgSessionId(e.target.value)}
                                        className="w-full bg-surface/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-accent"
                                        required
                                    >
                                        <option value="">Select account</option>
                                        {connections.map(c => (
                                            <option key={c.sessionId} value={c.sessionId}>
                                                {c.name || c.sessionId} ({c.phone || 'No number'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="text-[10px] font-medium text-secondary mb-1 block">API Key</label>
                                    <select
                                        value={msgApiKey}
                                        onChange={e => setMsgApiKey(e.target.value)}
                                        className="w-full bg-surface/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-accent"
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
                                <label className="text-[10px] font-medium text-secondary mb-1 block">Recipient Number</label>
                                <input
                                    className="w-full bg-surface/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-accent"
                                    placeholder="+919876543210"
                                    value={msgPhone}
                                    onChange={e => setMsgPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="text-[10px] font-medium text-secondary mb-1 block">Message</label>
                                <textarea
                                    className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-accent resize-none"
                                    rows={3}
                                    placeholder="Your message here..."
                                    value={msgContent}
                                    onChange={e => setMsgContent(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
                                disabled={sendingMsg || !isWhatsAppConnected}
                            >
                                {sendingMsg ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                                {isWhatsAppConnected ? 'Send Message' : 'Connect WhatsApp First'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* OTP Test Console (Moved to its own row or below) */}
                <div className="card lg:col-span-3">
                    <div className="card-header border-b border-white/5">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <Smartphone size={18} className="text-accent" />
                            WhatsApp OTP Test Console
                        </h3>
                    </div>
                    <div className="card-body flex flex-col md:flex-row gap-8 py-6 items-center">
                        <div className="flex-1 w-full max-w-md">
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. 919876543210"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    disabled={mode === 'verify'}
                                />
                            </div>

                            {mode === 'verify' && (
                                <div className="form-group mt-4 animate-in">
                                    <label className="form-label">Enter OTP</label>
                                    <input
                                        className="form-input"
                                        placeholder="------"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="mt-6 flex gap-3">
                                {mode === 'send' ? (
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={handleSendOtp}
                                        disabled={sending || !phone || !isWhatsAppConnected}
                                    >
                                        {sending ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
                                        Send Test OTP
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-primary flex-1"
                                            onClick={handleVerifyOtp}
                                            disabled={sending || !otp}
                                        >
                                            {sending ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
                                            Verify OTP
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setMode('send')}>Cancel</button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:block w-px h-32 bg-white/5"></div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <div className={`w-3 h-3 rounded-full ${isWhatsAppConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium">WhatsApp Status: {isWhatsAppConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <p className="text-xs text-secondary opacity-70 leading-relaxed">
                                Use this console to test your WhatsApp OTP integration manually.
                                Ensure your WhatsApp account is linked and you have at least one active API key.
                            </p>
                            <div className="flex gap-4 pt-2">
                                <Link to="/whatsapp" className="text-xs text-accent hover:underline no-underline">Connect WhatsApp →</Link>
                                <Link to="/docs" className="text-xs text-accent hover:underline no-underline">API Tutorial →</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
