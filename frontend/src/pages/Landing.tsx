import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Globe, Smartphone, BarChart3, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="flex items-center gap-2">
                    <div className="logo-mark">W</div>
                    <span className="font-bold text-xl tracking-tight">WOTP</span>
                </div>
                <div className="flex gap-4">
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary btn-sm">
                            Dashboard <ArrowRight size={16} />
                        </Link>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            Get Started
                        </Link>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <header className="hero">
                <div className="hero-badge">
                    <Zap size={14} fill="currentColor" />
                    <span>New: WhatsApp Business API Support added</span>
                </div>
                <h1 className="hero-title">
                    The Fastest Way to Send <br />
                    <span className="gradient-text">WhatsApp OTPs</span>
                </h1>
                <p className="hero-sub">
                    Reliable, affordable, and developer-friendly OTP delivery via WhatsApp.
                    Integrate in minutes with our simple REST API.
                </p>
                <div className="hero-cta">
                    <Link to="/login" className="btn btn-primary btn-lg">
                        Start for Free <ArrowRight size={20} />
                    </Link>
                    <Link to="/docs" className="btn btn-secondary btn-lg">
                        Read Documentation
                    </Link>
                </div>
            </header>

            {/* Features */}
            <section className="features-section">
                <h2 className="section-title">Everything you need</h2>
                <p className="section-sub">Built for developers, by developers.</p>

                <div className="features-grid">
                    <FeatureCard
                        icon={Smartphone}
                        title="WhatsApp First"
                        desc="Leverage the most popular messaging app for higher conversion rates."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Secure & Encrypted"
                        desc="End-to-end encryption ensuring your OTPs never get intercepted."
                    />
                    <FeatureCard
                        icon={Globe}
                        title="Global Reach"
                        desc="Deliver OTPs to any WhatsApp number instantly, anywhere in the world."
                    />
                    <FeatureCard
                        icon={Zap}
                        title="Lightning Fast"
                        desc="Average delivery time under 2 seconds. Don't keep users waiting."
                    />
                    <FeatureCard
                        icon={BarChart3}
                        title="Real-time Analytics"
                        desc="Track delivery rates, failures, and usage in real-time."
                    />
                    <FeatureCard
                        icon={Lock}
                        title="Developer Security"
                        desc="API Key scoping, IP whitelisting, and rate limiting out of the box."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-[var(--border)] text-center text-sm text-secondary">
                <p>&copy; {new Date().getFullYear()} WOTP Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
    return (
        <div className="feature-card">
            <div className="feature-icon">
                <Icon size={24} />
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
        </div>
    );
}
