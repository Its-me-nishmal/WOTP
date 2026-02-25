import { MessageSquare, Zap, Shield, CheckCircle, Smartphone } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export default function PremiumUpgradeModal({ isOpen, onClose, featureName = "Premium Features" }: Props) {
    if (!isOpen) return null;

    const adminNumber = "917994107442";
    const waLink = `https://wa.me/${adminNumber}?text=${encodeURIComponent(`Hi, I'm interested in the WOTP Premium Plan for ${featureName}. Can you provide more details?`)}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-pop" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Upgrade to Premium</h3>
                            <p className="text-xs text-secondary">Unlock the full power of WOTP</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body py-6">
                    <div className="bg-surface border rounded-xl p-4 mb-6">
                        <p className="text-sm font-medium mb-3">You just discovered a <span className="text-accent">Pro feature</span>:</p>
                        <div className="flex items-center gap-3 text-sm text-primary font-bold">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                <CheckCircle size={14} />
                            </div>
                            {featureName}
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <FeatureItem icon={Smartphone} title="Multiple WhatsApp Clients" desc="Connect 2+ numbers to a single account." />
                        <FeatureItem icon={MessageSquare} title="Higher Transactional Limits" desc="Send up to 50k messages per month." />
                        <FeatureItem icon={Shield} title="Priority Support" desc="Direct access to our technical team." />
                    </div>

                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        <MessageSquare size={18} />
                        Contact Admin for Premium
                    </a>

                    <button
                        className="w-full mt-3 text-xs text-secondary hover:text-primary transition-colors py-2"
                        onClick={onClose}
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex gap-3">
            <div className="text-secondary mt-0.5">
                <Icon size={18} />
            </div>
            <div>
                <h4 className="text-sm font-bold leading-none mb-1">{title}</h4>
                <p className="text-xs text-secondary leading-tight">{desc}</p>
            </div>
        </div>
    );
}
