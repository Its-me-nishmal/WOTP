import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import AdvancedTestConsole from '../components/dashboard/AdvancedTestConsole';
import AdvancedMessagingConsole from '../components/dashboard/AdvancedMessagingConsole';
import { Smartphone, Send, Info, Terminal } from 'lucide-react';

export default function Playground() {
    const [tab, setTab] = useState<'otp' | 'messaging'>('otp');

    return (
        <AppLayout title="API Playground">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-2xl font-bold text-primary mb-2 tracking-tight">Interactive Sandbox</h2>
                        <p className="text-secondary max-w-xl text-sm leading-relaxed">
                            Experiment with advanced configurations for both OTP and Transactional Messaging.
                            Verify your integration parameters before moving to production.
                        </p>
                    </div>

                    {/* Premium Tabs */}
                    <div className="flex p-1 bg-surface border border-white/5 rounded-2xl w-fit">
                        <button
                            onClick={() => setTab('otp')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'otp' ? 'bg-card text-accent shadow-lg shadow-black/20' : 'text-secondary hover:text-primary'}`}
                        >
                            <Smartphone size={16} />
                            OTP Testing
                        </button>
                        <button
                            onClick={() => setTab('messaging')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'messaging' ? 'bg-card text-accent shadow-lg shadow-black/20' : 'text-secondary hover:text-primary'}`}
                        >
                            <Send size={16} />
                            Messaging
                        </button>
                    </div>
                </div>

                <div className="animate-in transition-all duration-300">
                    {tab === 'otp' ? (
                        <AdvancedTestConsole onSuccess={() => { }} />
                    ) : (
                        <AdvancedMessagingConsole onSuccess={() => { }} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    <div className="card bg-white/[0.02] border-white/5 p-6 rounded-2xl">
                        <h3 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Info size={16} className="text-accent" />
                            Integration Tips
                        </h3>
                        <ul className="space-y-4 text-xs text-secondary leading-relaxed">
                            <li className="flex gap-4">
                                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">1</span>
                                <p>Always include the <strong>country code</strong> without spaces or special characters in the API request.</p>
                            </li>
                            <li className="flex gap-4">
                                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">2</span>
                                <p>Transactional messaging supports <strong>Markdown</strong> formatting and high-quality emojis.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="card bg-white/[0.02] border-white/5 p-6 rounded-2xl">
                        <h3 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Terminal size={16} className="text-accent" />
                            API Status
                        </h3>
                        <div className="bg-base/50 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] text-secondary uppercase font-bold">Endpoint</span>
                                <span className="text-[10px] text-accent font-mono">READY</span>
                            </div>
                            <code className="text-[11px] font-mono text-secondary break-all">
                                {tab === 'otp' ? 'POST /api/otp/send' : 'POST /api/message/send'}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
