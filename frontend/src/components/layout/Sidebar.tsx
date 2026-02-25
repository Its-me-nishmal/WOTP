import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Key, Smartphone, FileText,
  Settings, LogOut, Zap, Book, Terminal, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen?: boolean;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/api-keys', icon: Key, label: 'API Keys' },
  { to: '/whatsapp', icon: Smartphone, label: 'WhatsApp' },
  { to: '/messaging', icon: MessageSquare, label: 'Direct Messaging' },
  { to: '/playground', icon: Terminal, label: 'API Playground' },
  { to: '/logs', icon: FileText, label: 'Logs' },
  { to: '/docs', icon: Book, label: 'Documentation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">W</div>
        <div className="logo-text">WO<span>TP</span></div>
      </div>

      {/* Nav Links */}
      <div className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Footer: user info + logout */}
      <div className="sidebar-footer">
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0', borderBottom: '1px solid var(--border)',
            marginBottom: 10,
          }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.email}
              </div>
            </div>
            <span
              className={`badge ${user.plan === 'pro' ? 'badge-purple' : 'badge-gray'}`}
              style={{ fontSize: 10 }}
            >
              {user.plan === 'pro' && <Zap size={9} />}
              {user.plan.toUpperCase()}
            </span>
          </div>
        )}
        <button
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
