import { Link } from 'react-router-dom'
import { MessageSquare, Zap, Shield, Code, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
    {
        icon: MessageSquare,
        title: 'WhatsApp Delivery',
        description: 'Send OTPs directly via WhatsApp. 98% open rate vs 20% for SMS.',
    },
    {
        icon: Zap,
        title: 'Instant Verification',
        description: 'Sub-second OTP delivery and verification with Redis-backed speed.',
    },
    {
        icon: Shield,
        title: 'Secure by Design',
        description: 'Hashed OTP storage, rate limiting, and automatic expiry built-in.',
    },
    {
        icon: Code,
        title: 'Simple REST API',
        description: 'Two endpoints to get started. Send and verify OTPs in minutes.',
    },
]

const plans = [
    {
        name: 'Free',
        price: '$0',
        messages: '100 OTPs/month',
        features: ['1 WhatsApp number', 'REST API access', 'Basic logs', 'Community support'],
        cta: 'Get Started Free',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$19',
        messages: '10,000 OTPs/month',
        features: ['1 WhatsApp number', 'REST API access', 'Full logs & analytics', 'Priority support', 'Custom OTP templates'],
        cta: 'Start Pro Trial',
        highlight: true,
    },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Nav */}
            <nav className="border-b border-white/10 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-xl text-white">WOTP</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            Log in
                        </Link>
                        <Link
                            to="/login"
                            id="cta-get-started"
                            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-brand-400 text-sm font-medium mb-6">
                    <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
                    WhatsApp OTP API for Developers
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                    OTPs via WhatsApp.
                    <br />
                    <span className="text-transparent bg-clip-text gradient-brand">10× cheaper than SMS.</span>
                </h1>
                <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    Send and verify one-time passwords through WhatsApp with a simple REST API.
                    No carrier fees. No delivery failures. Free to start.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/login"
                        id="hero-primary-cta"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-brand text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105"
                    >
                        Start Building for Free <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a
                        href="#api"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass text-gray-200 font-semibold text-lg hover:bg-white/10 transition-all"
                    >
                        View API Docs
                    </a>
                </div>
            </section>

            {/* Code snippet */}
            <section id="api" className="max-w-4xl mx-auto px-6 pb-24">
                <div className="glass rounded-2xl p-6 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-2 text-gray-500 text-xs">Send OTP in 2 lines</span>
                    </div>
                    <div className="space-y-1">
                        <div><span className="text-purple-400">curl</span><span className="text-gray-300"> -X POST https://api.wotp.dev/v1/otp/send \</span></div>
                        <div><span className="text-gray-300">  -H </span><span className="text-green-400">"X-API-Key: wk_live_xxx"</span><span className="text-gray-300"> \</span></div>
                        <div><span className="text-gray-300">  -d </span><span className="text-green-400">'{`{"phone":"+919876543210"}`}'</span></div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-brand-400">
                            {'// → {"success":true,"otp_id":"otp_abc123","expires_in":300}'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                <h2 className="text-3xl font-bold text-center mb-12">Why developers choose WOTP</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f) => (
                        <div key={f.title} className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <f.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="max-w-4xl mx-auto px-6 pb-24">
                <h2 className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl p-8 border ${plan.highlight
                                    ? 'border-brand-500 bg-brand-950/50 ring-1 ring-brand-500/30'
                                    : 'glass'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">Most Popular</div>
                            )}
                            <div className="text-2xl font-bold text-white mb-1">{plan.name}</div>
                            <div className="text-4xl font-extrabold text-white mb-1">{plan.price}<span className="text-lg font-normal text-gray-400">/mo</span></div>
                            <div className="text-brand-400 text-sm font-medium mb-6">{plan.messages}</div>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-gray-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/login"
                                id={`plan-cta-${plan.name.toLowerCase()}`}
                                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${plan.highlight
                                        ? 'gradient-brand text-white hover:opacity-90'
                                        : 'glass text-gray-200 hover:bg-white/10'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 py-8 text-center text-gray-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded gradient-brand flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-bold text-gray-300">WOTP</span>
                </div>
                <p>© 2026 WOTP. WhatsApp-based OTP platform for developers.</p>
            </footer>
        </div>
    )
}
