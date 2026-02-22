import { type ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface Props {
    children: ReactNode;
    title: string;
    actions?: ReactNode;
}

export default function AppLayout({ children, title, actions }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            {/* Sidebar - conditionally styled for mobile via CSS classes */}
            <Sidebar isOpen={sidebarOpen} />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                    }}
                    className="md:hidden" // Tailwind utility if configured, else logic in index.css handles it
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="main-content">
                {/* Top bar */}
                <header className="topbar">
                    <div className="flex items-center gap-3">
                        <button
                            className="btn btn-secondary btn-icon md:hidden" // visible only on mobile via CSS
                            style={{ display: 'none' }} // Replaced by media query in CSS generally, but explicit hide here as base
                            onClick={() => setSidebarOpen(o => !o)}
                            id="menu-toggle"
                        >
                            <Menu size={18} />
                        </button>
                        <h1 className="topbar-title">{title}</h1>
                    </div>
                    <div className="topbar-right">{actions}</div>
                </header>

                {/* Page content */}
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
