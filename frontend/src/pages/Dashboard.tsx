import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Smartphone, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import UsageBar from '../components/ui/UsageBar';
import { dashboardApi, otpApi, whatsappApi } from '../services/api';
import type { DashboardStats } from '../types';
import { useToast } from '../hooks/useToast';

export default function Dashboard() {
    const navigate = useNavigate();
    const { show } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [loading, setLoading] = useState(true);
    const isWhatsAppConnected = wsStatus === 'connected';

    // Simple Test Console State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [mode, setMode] = useState<'send' | 'verify'>('send');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, wsRes] = await Promise.all([
                dashboardApi.getStats(),
                whatsappApi.getStatus()
            ]);
            setStats(statsRes);
            setWsStatus(wsRes.status);
        } catch (err) {
            show('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        try {
            setSending(true);
            await otpApi.sendTest({ phone });
            setMode('verify');
            show('OTP Sent via WhatsApp!', 'success');
            loadData(); // Refresh stats immediately
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async () => {
        try {
            setSending(true);
            const res = await otpApi.verifyTest(phone, otp);
            if (res.success) {
                show('Verification Successful!', 'success');
                setMode('send');
                setOtp('');
                setPhone('');
                loadData(); // refresh stats
            } else {
                show(res.message || 'Invalid OTP', 'error');
            }
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <AppLayout title="Dashboard">Loading...</AppLayout>;

    return (
        <AppLayout title="Dashboard">
            {/* Stats Grid */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon green"><Activity size={20} /></div>
                    <div className="stat-label">Total Sent</div>
                    <div className="stat-value">{stats?.totalSent ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><CheckCircle size={20} /></div>
                    <div className="stat-label">Verified</div>
                    <div className="stat-value">{stats?.totalVerified ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><AlertTriangle size={20} /></div>
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value">{stats?.remainingOtps ?? 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><Smartphone size={20} /></div>
                    <div className="stat-label">Active Keys</div>
                    <div className="stat-value">{stats?.activeKeys ?? 0}</div>
                </div>
            </div>

            <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                {/* Usage Card */}
                <div className="card" style={{ flex: 1, minWidth: 300 }}>
                    <div className="card-header">
                        <h3 className="font-semibold">Current Plan Usage</h3>
                    </div>
                    <div className="card-body">
                        <UsageBar
                            label="Monthly OTP Limit"
                            value={stats ? (stats.planLimit - stats.remainingOtps) : 0}
                            max={stats?.planLimit ?? 100}
                        />
                        <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                            Plan resets on <strong>1st of every month</strong>.
                        </div>
                        <Link to="/settings" className="btn btn-secondary w-full no-underline flex items-center justify-center" style={{ marginTop: 24 }}>
                            Upgrade Plan
                        </Link>
                    </div>
                </div>

                {/* Test Console */}
                <div className="card" style={{ flex: 1, minWidth: 300 }}>
                    <div className="card-header">
                        <h3 className="font-semibold">Quick Test</h3>
                        <span className="badge badge-gray">Sandbox</span>
                    </div>
                    <div className="card-body text-center">
                        <div className="form-group text-left">
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
                            <div className="form-group text-left animate-in">
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

                        <div style={{ marginTop: 20 }}>
                            {mode === 'send' ? (
                                <button
                                    className={`btn w-full ${(!isWhatsAppConnected || (stats?.activeKeys ?? 0) === 0) ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => {
                                        if (!isWhatsAppConnected) return navigate('/whatsapp');
                                        if ((stats?.activeKeys ?? 0) === 0) return navigate('/api-keys');
                                        handleSend();
                                    }}
                                    disabled={sending || (isWhatsAppConnected && (stats?.activeKeys ?? 0) > 0 && !phone)}
                                >
                                    {sending ? <RefreshCw className="spinner mr-2" size={16} /> : null}
                                    {!isWhatsAppConnected
                                        ? 'Please Connect WhatsApp'
                                        : (stats?.activeKeys ?? 0) === 0
                                            ? 'Please Create API Key'
                                            : 'Send Test OTP'
                                    }
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={handleVerify}
                                    disabled={sending || !otp}
                                >
                                    {sending ? <RefreshCw className="spinner mr-2" size={16} /> : null}
                                    Verify OTP
                                </button>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-[var(--border)]">
                            <Link
                                to="/playground"
                                className="text-xs text-accent hover:underline no-underline font-medium"
                            >
                                Open Advanced Playground →
                            </Link>
                        </div>

                        {mode === 'verify' && (
                            <button
                                className="text-xs text-secondary w-full mt-4 underline text-center cursor-pointer bg-transparent border-0"
                                onClick={() => setMode('send')}
                            >
                                Reset / Send New
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
