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

const BASE_URL = 'https://wotp.onrender.com/api';

function ApiReference() {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('YOUR_API_KEY');

    useEffect(() => {
        if (user) {
            import('../services/api').then(m => m.apiKeysApi.list()).then(keys => {
                if (keys && keys.length > 0) {
                    setApiKey(keys[0].key || keys[0].prefix);
                }
            }).catch(console.error);
        }
    }, [user]);

    return (
        <section className="animate-in">
            <h1 className="docs-h1">API Reference</h1>
            <p className="docs-p">
                Integrate WOTP into your application using our simple REST API.
                All requests must be made over HTTPS to:
                <code className="ml-2 px-2 py-1 bg-surface border rounded text-accent">{BASE_URL}</code>
            </p>

            <h2 className="docs-h2">Authentication</h2>
            <p className="docs-p">Include your API key in the Authorization header:</p>
            <div className="docs-code-container">
                <div className="code-block">
                    Authorization: Bearer {apiKey}
                </div>
            </div>

            <h2 className="docs-h2">Endpoint: Send OTP</h2>
            <p className="docs-badge">POST /otp/send</p>

            <h3 className="docs-h3">Parameters</h3>
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

            <h3 className="docs-h3">Implementation Examples</h3>
            <CodeSnippet
                curl={`curl -X POST ${BASE_URL}/otp/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "919876543210",
    "length": 6,
    "message": "Your Login code is {{otp}}"
  }'`}
                node={`const axios = require('axios');

const sendOtp = async () => {
  try {
    const response = await axios.post('${BASE_URL}/otp/send', {
      phone: '919876543210',
      length: 6,
      message: 'Your Login code is {{otp}}'
    }, {
      headers: { 'Authorization': 'Bearer ${apiKey}' }
    });
    console.log(response.data);
  } catch (err) {
    console.error(err.response.data);
  }
};`}
                fetch={`fetch('${BASE_URL}/otp/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '919876543210',
    length: 6
  })
})
.then(res => res.json())
.then(console.log);`}
            />

            <h2 className="docs-h2">Endpoint: Verify OTP</h2>
            <p className="docs-badge">POST /otp/verify</p>

            <h3 className="docs-h3">Implementation Examples</h3>
            <CodeSnippet
                curl={`curl -X POST ${BASE_URL}/otp/verify \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "919876543210",
    "otp": "123456"
  }'`}
                node={`const axios = require('axios');

const verifyOtp = async () => {
  try {
    const response = await axios.post('${BASE_URL}/otp/verify', {
      phone: '919876543210',
      otp: '123456'
    }, {
      headers: { 'Authorization': 'Bearer ${apiKey}' }
    });
    console.log(response.data);
  } catch (err) {
    console.error(err.response.data);
  }
};`}
                fetch={`fetch('${BASE_URL}/otp/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '919876543210',
    otp: '123456'
  })
})
.then(res => res.json())
.then(console.log);`}
            />

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

function CodeSnippet({ curl, node, fetch }: { curl: string, node: string, fetch: string }) {
    const [tab, setTab] = useState<'curl' | 'node' | 'fetch'>('curl');
    const [copied, setCopied] = useState(false);

    const code = tab === 'curl' ? curl : tab === 'node' ? node : fetch;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="docs-code-container">
            <div className="docs-code-tabs">
                <button className={`docs-code-tab ${tab === 'curl' ? 'active' : ''}`} onClick={() => setTab('curl')}>cURL</button>
                <button className={`docs-code-tab ${tab === 'node' ? 'active' : ''}`} onClick={() => setTab('node')}>Node.js</button>
                <button className={`docs-code-tab ${tab === 'fetch' ? 'active' : ''}`} onClick={() => setTab('fetch')}>Fetch</button>

                <button className={`docs-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? <CheckCircle size={12} /> : <Terminal size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="code-block" style={{ whiteSpace: 'pre-wrap' }}>
                {code}
            </pre>
        </div>
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
