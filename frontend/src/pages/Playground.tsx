import AppLayout from '../components/layout/AppLayout';
import AdvancedTestConsole from '../components/dashboard/AdvancedTestConsole';

export default function Playground() {
    return (
        <AppLayout title="API Playground">
            <div className="max-w-5xl">
                <div style={{ marginBottom: 32 }}>
                    <h2 className="text-xl font-bold text-primary mb-2">Interactive API Testing</h2>
                    <p className="text-secondary max-w-2xl">
                        Experiment with different OTP configurations, lengths, and formats. Use this environment to verify your integration logic before deploying to production.
                    </p>
                </div>

                <div className="animate-in">
                    <AdvancedTestConsole onSuccess={() => { }} />
                </div>

                <div className="card mt-8 bg-base p-6">
                    <h3 className="font-semibold text-primary mb-4">Quick Tips</h3>
                    <ul className="space-y-3 text-sm text-secondary">
                        <li className="flex gap-2">
                            <span className="text-accent">•</span>
                            Select an <strong>API Key</strong> to simulate how logs will appear in your history.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-accent">•</span>
                            <strong>Alphanumeric</strong> codes are case-insensitive during verification.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-accent">•</span>
                            Ensure your WhatsApp session is <strong>Connected</strong> in the WhatsApp tab before testing.
                        </li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
