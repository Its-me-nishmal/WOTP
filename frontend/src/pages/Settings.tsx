import { User, Shield, CreditCard, Zap } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function Settings() {
    const { user } = useAuth();
    const { show } = useToast();

    return (
        <AppLayout title="Settings">
            <div className="max-w-4xl">
                <div style={{ marginBottom: 32 }}>
                    <p className="text-secondary">Manage your account preferences and plan details.</p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Profile Section */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User size={18} className="text-accent" />
                                Profile Information
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                                    {user?.name[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">{user?.name}</h2>
                                    <p className="text-secondary">{user?.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">Account ID</label>
                                    <div className="copy-field">
                                        <span className="copy-field-value font-mono">{user?.id}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Current Plan</label>
                                    <div>
                                        <span className={`badge ${user?.plan === 'pro' ? 'badge-purple' : 'badge-gray'}`} style={{ padding: '8px 16px', fontSize: 13 }}>
                                            {user?.plan === 'pro' && <Zap size={14} />}
                                            {user?.plan?.toUpperCase()} {user?.plan === 'pro' ? 'PLAN' : 'TIER'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Security Section */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Shield size={18} className="text-accent2" />
                                    Security
                                </h3>
                            </div>
                            <div className="card-body">
                                <p className="text-secondary text-sm mb-4">
                                    Your account is authenticated via Google. Password management is handled by your Google Account security settings.
                                </p>
                                <button className="btn btn-secondary btn-sm w-full" onClick={() => show('Redirecting to Google Account settings...')}>
                                    Manage Google Account
                                </button>
                            </div>
                        </div>

                        {/* Billing Section */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <CreditCard size={18} className="text-warn" />
                                    Billing & Quota
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ background: 'var(--bg-base)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className="text-primary font-medium">Monthly Usage</span>
                                        <span className="text-secondary text-sm">{user?.usageCount} / {user?.plan === 'pro' ? '10,000' : '100'}</span>
                                    </div>
                                    <div style={{ height: 6, width: '100%', background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${Math.min(100, (user?.usageCount || 0) / (user?.plan === 'pro' ? 10000 : 100) * 100)}%`,
                                                background: 'var(--accent)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-primary w-full mt-6" onClick={() => show('Pro subscriptions are currently in closed beta. Contact support to upgrade.')}>
                                    Upgrade Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
