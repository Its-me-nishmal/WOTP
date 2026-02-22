import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronRight, Book, Terminal, Shield,
    Zap, Rocket, ArrowLeft,
    Package, Server, Globe, Smartphone,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

export default function Docs() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('getting-started');

    const sections = [
        { id: 'getting-started', label: 'Getting Started', icon: Rocket },
        { id: 'api-reference', label: 'API Reference', icon: Terminal },
        { id: 'architecture', label: 'Architecture', icon: Book },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    const content = (
        <div className="docs-page">
            <aside className="docs-sidebar">
                <div className="docs-sidebar-inner">
                    <h2 className="docs-nav-title">Documentation</h2>
                    <nav className="docs-nav">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                className={`docs-nav-item ${activeSection === s.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(s.id)}
                            >
                                <s.icon size={16} />
                                {s.label}
                                <ChevronRight className="chevron" size={14} />
                            </button>
                        ))}
                    </nav>

                    <div className="docs-sidebar-footer">
                        <Link to="/" className="docs-back-link">
                            <ArrowLeft size={14} /> Back to Home
                        </Link>
                    </div>
                </div>
            </aside>

            <main className="docs-content">
                <div className="docs-content-container">
                    {activeSection === 'getting-started' && <GettingStarted />}
                    {activeSection === 'api-reference' && <ApiReference />}
                    {activeSection === 'architecture' && <Architecture />}
                    {activeSection === 'security' && <Security />}
                </div>
            </main>
        </div>
    );

    // If user is logged in, wrap in AppLayout for consistent UI
    if (user) {
        return (
            <AppLayout title="Documentation">
                {content}
            </AppLayout>
        );
    }

    // Public view (Landing Page user)
    return (
        <div className="public-docs bg-base min-h-screen">
            <nav className="landing-nav">
                <Link to="/" className="flex items-center gap-2 no-underline text-primary">
                    <div className="logo-mark">W</div>
                    <span className="font-bold text-xl tracking-tight">WOTP</span>
                </Link>
                <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
            </nav>
            {content}
        </div>
    );
}

function GettingStarted() {
    return (
        <section className="animate-in">
            <h1 className="docs-h1">Getting Started</h1>
            <p className="docs-p">
                WOTP is a developer-focused platform for sending One-Time Passwords via WhatsApp.
                Follow this guide to get up and running in minutes.
            </p>

            <h2 className="docs-h2">1. Connect WhatsApp</h2>
            <p className="docs-p">
                Go to the <Link to="/whatsapp" className="docs-link">WhatsApp</Link> section in your dashboard
                and scan the QR code with your mobile device. This links your WhatsApp account as an OTP sender.
            </p>

            <h2 className="docs-h2">2. Generate API Key</h2>
            <p className="docs-p">
                Navigate to <Link to="/api-keys" className="docs-link">API Keys</Link> and create a new key.
                Keep this key secure as it grants access to send messages from your linked account.
            </p>

            <h2 className="docs-h2">3. Send your first OTP</h2>
            <p className="docs-p">
                Use the <Link to="/dashboard" className="docs-link">Dashboard Tester</Link> to send a test message,
                or use our API directly from your application.
            </p>

            <div className="docs-info-card">
                <Zap className="text-accent" size={20} />
                <div>
                    <h4 className="font-bold">Pro Tip</h4>
                    <p className="text-sm">You can use our Dev Login feature to quickly test the dashboard without setting up Google OAuth.</p>
                </div>
            </div>
        </section>
    );
}

function ApiReference() {
    return (
        <section className="animate-in">
            <h1 className="docs-h1">API Reference</h1>
            <p className="docs-p">
                Integrate WOTP into your application using our simple REST API.
                All requests must be made over HTTPS.
            </p>

            <h2 className="docs-h2">Authentication</h2>
            <p className="docs-p">Include your API key in the Authorization header:</p>
            <div className="code-block">
                Authorization: Bearer YOUR_API_KEY
            </div>

            <h2 className="docs-h2">Endpoint: Send OTP</h2>
            <p className="docs-badge">POST /api/otp/send</p>
            <div className="table-wrap" style={{ margin: '16px 0' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="text-accent">phone</code></td>
                            <td>string</td>
                            <td>Phone number with country code (e.g. 919876543210)</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">length</code></td>
                            <td>number</td>
                            <td>Character length of OTP (4-12, default: 6).</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">type</code></td>
                            <td>string</td>
                            <td>`numeric`, `alphanumeric`, or `alpha` (default: `numeric`).</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">expiresIn</code></td>
                            <td>number</td>
                            <td>Expiry time in seconds (30-3600, default: 300).</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">message</code></td>
                            <td>string</td>
                            <td>Custom template. Use <code className="text-accent">{"{{otp}}"}</code> as a placeholder.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="docs-h3">Example Request</h3>
            <div className="code-block">
                {`curl -X POST https://api.wotp.com/api/otp/send \\
  -H "Authorization: Bearer wk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "919876543210",
    "length": 8,
    "type": "alphanumeric",
    "message": "Your secure login code is {{otp}}"
  }'`}
            </div>

            <h3 className="docs-h3">Success Response</h3>
            <div className="code-block">
                {`{
  "success": true,
  "message": "OTP sent",
  "phone": "919876543210"
}`}
            </div>

            <h2 className="docs-h2">Endpoint: Verify OTP</h2>
            <p className="docs-badge">POST /api/otp/verify</p>
            <div className="table-wrap" style={{ margin: '16px 0' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="text-accent">phone</code></td>
                            <td>string</td>
                            <td>Phone number used for sending OTP</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">otp</code></td>
                            <td>string</td>
                            <td>The OTP provided by the user</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="docs-h3">Success Response</h3>
            <div className="code-block">
                {`{
  "success": true,
  "message": "OTP verified successfully"
}`}
            </div>

            <h2 className="docs-h2">Status Codes</h2>
            <div className="table-wrap" style={{ margin: '16px 0' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Meaning</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="text-accent">200</code></td>
                            <td>OK</td>
                            <td>Request successful.</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">400</code></td>
                            <td>Bad Request</td>
                            <td>Missing or invalid parameters.</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">401</code></td>
                            <td>Unauthorized</td>
                            <td>Invalid or missing API key.</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">403</code></td>
                            <td>Forbidden</td>
                            <td>WhatsApp disconnected or account restricted.</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">429</code></td>
                            <td>Limit Exceeded</td>
                            <td>Rate limit or monthly quota reached.</td>
                        </tr>
                        <tr>
                            <td><code className="text-accent">500</code></td>
                            <td>Server Error</td>
                            <td>Internal server processing error.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function Architecture() {
    return (
        <section className="animate-in">
            <h1 className="docs-h1">System Architecture</h1>
            <p className="docs-p">
                WOTP is built on a scalable, modern stack designed for high availability and low latency.
            </p>

            <div className="docs-grid">
                <ArchCard icon={Server} title="Express Backend" desc="Node.js server handling API logic and authentication." />
                <ArchCard icon={Smartphone} title="Baileys Integration" desc="Custom-built WhatsApp Web bridge for reliable messaging." />
                <ArchCard icon={Package} title="BullMQ Queues" desc="Redis-backed queues ensure message delivery even under load." />
                <ArchCard icon={Globe} title="React Dashboard" desc="Modern Vite-powered interface for real-time monitoring." />
            </div>

            <h2 className="docs-h2">Delivery Flow</h2>
            <div className="docs-steps">
                <div className="docs-step">
                    <div className="docs-step-num">1</div>
                    <div className="docs-step-content">
                        <strong>API Request:</strong> Your server hits our endpoint with an API key.
                    </div>
                </div>
                <div className="docs-step">
                    <div className="docs-step-num">2</div>
                    <div className="docs-step-content">
                        <strong>Validation:</strong> We verify the key, check rate limits, and store the OTP hash.
                    </div>
                </div>
                <div className="docs-step">
                    <div className="docs-step-num">3</div>
                    <div className="docs-step-content">
                        <strong>Queueing:</strong> The message is pushed to our Redis-backed job queue.
                    </div>
                </div>
                <div className="docs-step">
                    <div className="docs-step-num">4</div>
                    <div className="docs-step-content">
                        <strong>Delivery:</strong> A worker retrieves the active WhatsApp session and sends the message.
                    </div>
                </div>
            </div>
        </section>
    );
}

function Security() {
    return (
        <section className="animate-in">
            <h1 className="docs-h1">Security First</h1>
            <p className="docs-p">
                We take security seriously. Your data and your users' data are protected at every layer.
            </p>

            <div className="docs-security-item">
                <CheckCircle size={18} className="text-accent" />
                <div>
                    <strong>OTP Hashing:</strong> We never store plain-text OTPs. Everything is salted and hashed.
                </div>
            </div>
            <div className="docs-security-item">
                <CheckCircle size={18} className="text-accent" />
                <div>
                    <strong>API Key Protection:</strong> API keys are hashed (SHA-256) before storage.
                    If our database is ever compromised, your raw keys remain safe.
                </div>
            </div>
            <div className="docs-security-item">
                <CheckCircle size={18} className="text-accent" />
                <div>
                    <strong>End-to-End Encryption:</strong> All WhatsApp communication is encrypted by
                    the underlying WhatsApp protocol.
                </div>
            </div>
            <div className="docs-security-item">
                <CheckCircle size={18} className="text-accent" />
                <div>
                    <strong>Rate Limiting:</strong> Intelligent rate limiting prevents abuse and ensures
                    platform stability for all users.
                </div>
            </div>
        </section>
    );
}

function ArchCard({ icon: Icon, title, desc }: any) {
    return (
        <div className="docs-arch-card">
            <div className="docs-arch-icon">
                <Icon size={20} />
            </div>
            <div>
                <h4 className="font-bold text-sm mb-1">{title}</h4>
                <p className="text-xs text-secondary leading-normal">{desc}</p>
            </div>
        </div>
    );
}
