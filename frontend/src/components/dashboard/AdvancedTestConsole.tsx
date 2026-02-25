import { useState, useEffect } from 'react';
import { Terminal, Send, CheckCircle, RefreshCw, Smartphone, Key, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiKeysApi, otpApi, whatsappApi } from '../../services/api';
import type { ApiKey } from '../../types';
import { useToast } from '../../hooks/useToast';
import PhoneInput from '../ui/PhoneInput';

interface Props {
    onSuccess: () => void;
}

export default function AdvancedTestConsole({ onSuccess }: Props) {
    const { show } = useToast();
    const navigate = useNavigate();
    const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const isWhatsAppConnected = wsStatus === 'connected';

    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // Form State
    const [countryCode, setCountryCode] = useState('91');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [length, setLength] = useState(6);
    const [type, setType] = useState<'numeric' | 'alphanumeric' | 'alpha'>('numeric');
    const [expiresIn, setExpiresIn] = useState(300);
    const [message, setMessage] = useState('');
    const [mode, setMode] = useState<'send' | 'verify'>('send');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [keysRes, wsRes] = await Promise.all([
                apiKeysApi.list(),
                whatsappApi.getStatus()
            ]);
            setKeys(keysRes);
            const isAllConnected = wsRes.connections.some(c => c.status === 'connected');
            setWsStatus(isAllConnected ? 'connected' : 'disconnected');
            if (keysRes.length > 0) setSelectedKeyId(keysRes[0].id);
        } catch (err) {
            show('Failed to load session status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        const fullPhone = `+${countryCode}${phone}`;
        if (!phone) return show('Phone number required', 'error');
        setSending(true);
        try {
            await otpApi.sendTest({
                phone: fullPhone,
                apiKeyId: selectedKeyId,
                length,
                type,
                expiresIn,
                message: message || undefined
            });
            setMode('verify');
            show('OTP Sent via WhatsApp!', 'success');
            onSuccess(); // Refresh any parent stats
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async () => {
        const fullPhone = `+${countryCode}${phone}`;
        if (!otp) return show('Enter the OTP', 'error');
        setSending(true);
        try {
            const res = await otpApi.verifyTest(fullPhone, otp);
            if (res.success) {
                show('Verification Successful!', 'success');
                setMode('send');
                setOtp('');
                onSuccess();
            } else {
                show(res.message || 'Invalid OTP', 'error');
            }
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="card advanced-console-card">
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-accent" />
                    <h3 className="font-semibold">Advanced Test Console</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border)] mr-2">
                        <button
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'send' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-primary bg-transparent'}`}
                            onClick={() => setMode('send')}
                        >
                            Send
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'verify' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-primary bg-transparent'}`}
                            onClick={() => setMode('verify')}
                        >
                            Verify
                        </button>
                    </div>
                    <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => {
                            setMode('send');
                            setPhone('');
                            setOtp('');
                            setMessage('');
                        }}
                        title="Reset"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            <div className="card-body gap-6 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Core Settings */}
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label flex items-center gap-2">
                                <Smartphone size={14} /> Recovery Phone
                            </label>
                            <PhoneInput
                                countryCode={countryCode}
                                phoneNumber={phone}
                                onCountryCodeChange={setCountryCode}
                                onPhoneNumberChange={setPhone}
                                disabled={mode === 'verify'}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label flex items-center gap-2">
                                <Key size={14} /> Select API Key
                            </label>
                            <select
                                className="form-input"
                                value={selectedKeyId}
                                onChange={e => setSelectedKeyId(e.target.value)}
                                disabled={loading || mode === 'verify'}
                            >
                                {keys.map(k => (
                                    <option key={k.id} value={k.id}>
                                        {k.name} ({k.prefix}...)
                                    </option>
                                ))}
                                {keys.length === 0 && !loading && <option value="">No keys found</option>}
                            </select>
                        </div>
                    </div>

                    {/* Right Column: Customization */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <Settings2 size={14} /> Length
                                </label>
                                <select
                                    className="form-input"
                                    value={length}
                                    onChange={e => setLength(Number(e.target.value))}
                                    disabled={mode === 'verify'}
                                >
                                    {[4, 5, 6, 7, 8, 10, 12].map(l => (
                                        <option key={l} value={l}>{l} Digits</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Format</label>
                                <select
                                    className="form-input"
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                    disabled={mode === 'verify'}
                                >
                                    <option value="numeric">Numeric</option>
                                    <option value="alphanumeric">Alphanumeric</option>
                                    <option value="alpha">Alphabet Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Expiry (seconds)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={expiresIn}
                                onChange={e => setExpiresIn(Number(e.target.value))}
                                disabled={mode === 'verify'}
                                step={30}
                                min={30}
                                max={3600}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group border-t border-[var(--border)] pt-6">
                    <label className="form-label flex items-center justify-between">
                        <span>Custom Message Template (Optional)</span>
                        <span className="text-xs text-secondary">Use {"{{otp}}"} as placeholder</span>
                    </label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="e.g. Your verification code is {{otp}}. Valid for 5 mins."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        disabled={mode === 'verify'}
                        style={{ resize: 'none' }}
                    />
                </div>

                {mode === 'verify' && (
                    <div className="form-group animate-in">
                        <label className="form-label font-bold text-accent">Enter Received OTP</label>
                        <input
                            className="form-input text-center text-xl tracking-[0.5em] font-bold"
                            placeholder="------"
                            maxLength={length}
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                <div className="pt-2">
                    {mode === 'send' ? (
                        <button
                            className={`btn btn-lg w-full flex items-center justify-center gap-2 ${(!isWhatsAppConnected || keys.length === 0) ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => {
                                if (!isWhatsAppConnected) return navigate('/whatsapp');
                                if (keys.length === 0) return navigate('/api-keys');
                                handleSend();
                            }}
                            disabled={sending || (isWhatsAppConnected && keys.length > 0 && !phone)}
                        >
                            {sending ? <RefreshCw className="spinner" size={18} /> : (isWhatsAppConnected && keys.length > 0 ? <Send size={18} /> : null)}
                            {!isWhatsAppConnected
                                ? 'Please Connect WhatsApp'
                                : keys.length === 0
                                    ? 'Please Create API Key'
                                    : 'Send Advanced OTP'
                            }
                        </button>
                    ) : (
                        <button
                            className="btn btn-success btn-lg w-full flex items-center justify-center gap-2"
                            onClick={handleVerify}
                            disabled={sending || !otp}
                        >
                            {sending ? <RefreshCw className="spinner" size={18} /> : <CheckCircle size={18} />}
                            Verify OTP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
