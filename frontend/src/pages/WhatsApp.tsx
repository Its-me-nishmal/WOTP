import { useEffect, useState } from 'react';
import { Plus, Smartphone, Loader2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/layout/AppLayout';
import { whatsappApi } from '../services/api';
import type { WhatsAppNumber } from '../types';
import { useToast } from '../hooks/useToast';

export default function WhatsApp() {
    const [status, setStatus] = useState<WhatsAppNumber['status']>('disconnected');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [connecting, setConnecting] = useState(false);
    const { show } = useToast();

    useEffect(() => {
        loadStatus();
    }, []);

    // Automatic Polling when modal is open or connecting
    useEffect(() => {
        let interval: any;
        if ((modalOpen && status !== 'connected') || status === 'connecting') {
            interval = setInterval(() => {
                whatsappApi.getStatus().then(res => {
                    if (res.status === 'connected') {
                        setStatus('connected');
                        setModalOpen(false);
                        setQrCode('');
                        show('WhatsApp Connected Successfully!', 'success');
                    } else {
                        setStatus(res.status);
                    }
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [modalOpen, status]);

    const loadStatus = () => {
        setLoading(true);
        whatsappApi.getStatus()
            .then(res => setStatus(res.status))
            .catch(() => show('Failed to load status', 'error'))
            .finally(() => setLoading(false));
    };

    const startConnect = async () => {
        setConnecting(true);
        try {
            const res = await whatsappApi.connect();
            if (res.qrCode) {
                setQrCode(res.qrCode);
                show('Scan the QR code with WhatsApp');
            } else {
                show(res.message || 'Connecting...');
            }
        } catch (err: any) {
            show(err.response?.data?.error || err.message, 'error');
        } finally {
            setConnecting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Disconnect this number?')) return;
        try {
            await whatsappApi.disconnect();
            setStatus('disconnected');
            show('Disconnected successfully');
        } catch (err: any) {
            show(err.message, 'error');
        }
    };

    return (
        <AppLayout
            title="WhatsApp"
            actions={
                status === 'disconnected' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
                        <Plus size={16} /> Connect WhatsApp
                    </button>
                )
            }
        >
            <div className="max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : status === 'disconnected' ? (
                    <div className="card empty-state">
                        <Smartphone size={48} />
                        <h3>No Connected Devices</h3>
                        <p>Connect your WhatsApp to start sending OTPs through your own number.</p>
                        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                            Connect Now
                        </button>
                    </div>
                ) : (
                    <div className="card card-glow">
                        <div className="card-header">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Smartphone size={18} className="text-accent" />
                                WhatsApp Session
                            </h3>
                            <span className={`badge ${status === 'connected' ? 'badge-green' : 'badge-orange'}`}>
                                {status === 'connected' && <span className="badge-dot" />}
                                {status.toUpperCase()}
                            </span>
                        </div>
                        <div className="card-body py-8 text-center">
                            <div className="text-4xl font-bold mb-2 text-primary">Connected</div>
                            <p className="text-secondary mb-8">
                                Your WhatsApp is active and ready to deliver OTP messages.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="btn btn-secondary btn-sm flex items-center gap-2"
                                    onClick={loadStatus}
                                >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                    Refresh Status
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleDelete}
                                >
                                    Disconnect Device
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Connect Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Connect WhatsApp</h3>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}>×</button>
                        </div>

                        {!qrCode ? (
                            <div className="flex flex-col gap-6 py-4 items-center text-center">
                                <div className="p-4 bg-accent/10 rounded-full text-accent">
                                    <Smartphone size={40} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Ready to connect?</h4>
                                    <p className="text-secondary text-sm">
                                        Clicking the button below will generate a one-time QR code.
                                        You'll need to scan it using your WhatsApp mobile app.
                                    </p>
                                </div>
                                <button
                                    className="btn btn-primary w-full py-3"
                                    onClick={startConnect}
                                    disabled={connecting}
                                >
                                    {connecting && <Loader2 className="animate-spin mr-2" size={18} />}
                                    Generate Connection QR
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white rounded-xl shadow-inner mb-2">
                                    <QRCodeSVG value={qrCode} size={200} level="H" includeMargin />
                                </div>
                                <p className="text-sm text-center text-secondary px-4">
                                    Scan this QR code with your WhatsApp app to link your device.
                                </p>
                                <button className="btn btn-secondary w-full" onClick={() => { setModalOpen(false); setQrCode(''); }}>
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
