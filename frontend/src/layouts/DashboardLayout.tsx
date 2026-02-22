import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { MessageSquare, LayoutDashboard, Key, ScrollText, Smartphone, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/dashboard/connect', icon: Smartphone, label: 'Connect WhatsApp' },
    { to: '/dashboard/keys', icon: Key, label: 'API Keys' },
    { to: '/dashboard/logs', icon: ScrollText, label: 'Logs' },
]

export default function DashboardLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-lg">WOTP</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                                    ? 'bg-brand-500/20 text-brand-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span className="flex-1">{label}</span>
                                    {isActive && <ChevronRight className="w-3 h-3 text-brand-400" />}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="px-3 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0) ?? 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.plan ?? 'free'} plan</p>
                        </div>
                    </div>
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
