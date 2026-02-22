import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Key, CheckCircle, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Stats {
    totalSent: number
    totalVerified: number
    activeKeys: number
    remainingOtps: number
    planLimit: number
}

export default function DashboardHome() {
    const { user } = useAuthStore()

    const { data: stats, isLoading } = useQuery<Stats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/otp/stats')
            return res.data
        },
    })

    const cards = [
        {
            label: 'OTPs Sent',
            value: stats?.totalSent ?? 0,
            icon: MessageSquare,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'OTPs Verified',
            value: stats?.totalVerified ?? 0,
            icon: CheckCircle,
            color: 'text-brand-400',
            bg: 'bg-brand-500/10',
        },
        {
            label: 'Active API Keys',
            value: stats?.activeKeys ?? 0,
            icon: Key,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
        },
        {
            label: 'OTPs Remaining',
            value: stats ? `${stats.remainingOtps} / ${stats.planLimit}` : '—',
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
        },
    ]

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">
                    Welcome back, {user?.name?.split(' ')[0] ?? 'developer'} 👋
                </h1>
                <p className="text-gray-400 mt-1">Here's what's happening with your WOTP account.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => (
                    <div key={card.label} className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-gray-400 text-sm">{card.label}</p>
                            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="h-7 bg-white/10 rounded animate-pulse w-20" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{card.value}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick start guide */}
            <div className="glass rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-4">Quick Start</h2>
                <ol className="space-y-3">
                    {[
                        { step: 1, label: 'Connect your WhatsApp', link: '/dashboard/connect', done: false },
                        { step: 2, label: 'Generate an API Key', link: '/dashboard/keys', done: false },
                        { step: 3, label: 'Send your first OTP via the API', link: null, done: false },
                    ].map(({ step, label, link }) => (
                        <li key={step} className="flex items-center gap-4">
                            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {step}
                            </div>
                            {link ? (
                                <a href={link} className="text-brand-400 hover:underline text-sm">{label}</a>
                            ) : (
                                <span className="text-gray-400 text-sm">{label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    )
}
