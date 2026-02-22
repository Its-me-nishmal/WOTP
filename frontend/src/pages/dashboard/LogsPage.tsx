import { useQuery } from '@tanstack/react-query'
import { ScrollText, CheckCircle2, XCircle, Search, Clock, Smartphone } from 'lucide-react'
import api from '@/lib/api'

interface OtpLog {
    id: string
    phone: string
    status: 'pending' | 'delivered' | 'verified' | 'failed'
    createdAt: string
    apiKeyName: string
}

export default function LogsPage() {
    const { data: logs = [], isLoading } = useQuery<OtpLog[]>({
        queryKey: ['otp-logs'],
        queryFn: async () => {
            const res = await api.get('/otp/logs')
            return res.data
        },
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle2 className="w-4 h-4 text-brand-400" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
            case 'expired': return <Clock className="w-4 h-4 text-gray-500" />
            default: return <Smartphone className="w-4 h-4 text-blue-400" />
        }
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <ScrollText className="w-6 h-6 text-brand-400" /> Messaging Logs
                    </h1>
                    <p className="text-gray-400 mt-1">Track every OTP sent and verified via your account.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search phone number..."
                        className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-4">
                                            <div className="h-5 bg-white/5 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <ScrollText className="w-12 h-12 mb-3" />
                                            <p className="text-gray-400 font-medium">No logs found yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-400 transition-colors">
                                                    <Smartphone className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-white">{log.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                <span className={`text-xs font-medium capitalize ${log.status === 'verified' ? 'text-brand-400' :
                                                    log.status === 'failed' ? 'text-red-400' :
                                                        'text-gray-400'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <code className="text-xs text-gray-600 font-mono bg-white/5 px-2 py-1 rounded">
                                                {log.id.substring(0, 12)}...
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
