import { useEffect, useState } from 'react';
import { Plus, Smartphone, Loader2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/layout/AppLayout';
import { whatsappApi } from '../services/api';
import type { WhatsAppNumber } from '../types';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import PremiumUpgradeModal from '../components/modals/PremiumUpgradeModal';

export default function WhatsApp() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<WhatsAppNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState('default');
    const { show } = useToast();

    useEffect(() => {
        loadStatus();
    }, []);

    // Automatic Polling for connecting sessions
    useEffect(() => {
        let interval: any;
        const hasConnecting = connections.some(c => c.status === 'connecting');

        if (modalOpen || hasConnecting) {
            interval = setInterval(() => {
                whatsappApi.getStatus().then(res => {
                    const wasConnecting = connections.find(c => c.sessionId === activeSessionId)?.status === 'connecting';
                    const nowConnected = res.connections.find(c => c.sessionId === activeSessionId)?.status === 'connected';

                    if (wasConnecting && nowConnected) {
                        show(`WhatsApp Connected: ${activeSessionId}`, 'success');
                        setModalOpen(false);
                        setQrCode('');
                    }
                    setConnections(res.connections);
                }).catch(() => { });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [modalOpen, connections, activeSessionId]);

    const loadStatus = () => {
        setLoading(true);
        whatsappApi.getStatus()
            .then(res => setConnections(res.connections))
            .catch(() => show('Failed to load status', 'error'))
            .finally(() => setLoading(false));
    };

    const handleAddClick = () => {
        // Restriction: Free users can only have ONE client.
        if (connections.length > 0 && user?.plan !== 'pro') {
            setUpgradeModalOpen(true);
            return;
        }

        // If they already have sessions, generate a new ID, otherwise 'default'
        if (connections.length > 0) {
            const nextId = `session_${connections.length + 1}`;
            setActiveSessionId(nextId);
        } else {
            setActiveSessionId('default');
        }

        setModalOpen(true);
        setQrCode('');
    };

    const startConnect = async () => {
        setConnecting(true);
        try {
            const res = await whatsappApi.connect(activeSessionId);
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

    const handleDelete = async (sessionId: string) => {
        if (!confirm(`Disconnect session "${sessionId}"?`)) return;
        try {
            await whatsappApi.disconnect(sessionId);
            setConnections(prev => prev.filter(c => c.sessionId !== sessionId));
            show('Disconnected successfully');
        } catch (err: any) {
            show(err.message, 'error');
        }
    };

    return (
        <AppLayout
            title="WhatsApp Connections"
            actions={
                <button
                    className={`btn btn-sm ${connections.length > 0 && user?.plan !== 'pro' ? 'btn-secondary opacity-70' : 'btn-primary'}`}
                    onClick={handleAddClick}
                >
                    <Plus size={16} /> Add WhatsApp Client
                    {connections.length > 0 && user?.plan !== 'pro' && (
                        <span className="ml-2 px-1 py-0.5 bg-accent text-[8px] text-white rounded font-bold uppercase">PRO</span>
                    )}
                </button>
            }
        >
            <div className="max-w-4xl mx-auto">
                {loading && connections.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : connections.length === 0 ? (
                    <div className="card empty-state">
                        <Smartphone size={48} />
                        <h3>No Connected Devices</h3>
                        <p>Connect your WhatsApp to start sending messages through your own number.</p>
                        <button className="btn btn-primary" onClick={handleAddClick}>
                            Connect First Device
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {connections.map((conn) => (
                            <div key={conn.sessionId} className="card card-glow overflow-hidden">
                                <div className="card-header border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${conn.status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            <Smartphone size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm capitalize">{conn.name || conn.sessionId}</h3>
                                            <p className="text-[10px] text-secondary">{conn.phone || 'No phone linked'}</p>
                                        </div>
                                    </div>
                                    <span className={`badge ${conn.status === 'connected' ? 'badge-green' : 'badge-orange'}`}>
                                        {conn.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="card-body py-6 flex flex-col items-center">
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-secondary btn-xs flex items-center gap-1"
                                            onClick={loadStatus}
                                        >
                                            <RefreshCw size={12} className={loading && connections.length > 0 ? 'animate-spin' : ''} />
                                            Update
                                        </button>
                                        <button
                                            className="btn btn-danger btn-xs"
                                            onClick={() => handleDelete(conn.sessionId)}
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* New Device Placeholder */}
                        <div
                            className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-accent/40 hover:bg-white/5 cursor-pointer transition-all gap-3"
                            onClick={handleAddClick}
                        >
                            <div className="p-3 bg-white/5 rounded-full text-secondary">
                                <Plus size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-sm">Add Another Client</p>
                                <p className="text-[10px] text-secondary">Connect another number</p>
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
                            <div>
                                <h3 className="modal-title font-bold">Connect WhatsApp</h3>
                                <p className="text-[10px] text-secondary">Session ID: {activeSessionId}</p>
                            </div>
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
                                        Scan the generated QR code with your WhatsApp app.
                                        This will link your number to the <strong>{activeSessionId}</strong> session.
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
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="p-4 bg-white rounded-xl shadow-inner mb-2 border-4 border-accent/20">
                                    <QRCodeSVG value={qrCode} size={200} level="H" includeMargin />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium">Scan QR Code</p>
                                    <p className="text-[11px] text-secondary max-w-[220px]">
                                        Open WhatsApp > Linked Devices > Link a Device
                                    </p>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-accent animate-pulse w-3/4"></div>
                                </div>
                                <button className="btn btn-secondary w-full mt-4" onClick={() => { setModalOpen(false); setQrCode(''); }}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <PremiumUpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                featureName="Multi-Client Support"
            />
        </AppLayout>
    );
}
