import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Smartphone, CheckCircle, XCircle, Loader2, RefreshCw, Smartphone as PhoneIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function ConnectPage() {
    const queryClient = useQueryClient()
    const [qrCode, setQrCode] = useState<string | null>(null)

    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: async () => {
            const res = await api.get('/whatsapp/status')
            return res.data as { status: 'connected' | 'disconnected' | 'connecting' }
        },
        refetchInterval: (data) => (data?.state?.data?.status === 'connecting' ? 2000 : 10000),
    })

    const connectMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/whatsapp/connect')
            return res.data
        },
        onSuccess: (data) => {
            if (data.qrCode) {
                setQrCode(data.qrCode)
                toast.success('QR Code generated!')
            }
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
        },
        onError: () => toast.error('Failed to start connection session'),
    })

    const disconnectMutation = useMutation({
        mutationFn: async () => {
            await api.delete('/whatsapp/disconnect')
        },
        onSuccess: () => {
            setQrCode(null)
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
            toast.success('WhatsApp disconnected')
        },
        onError: () => toast.error('Failed to disconnect'),
    })

    const status = statusData?.status || 'disconnected'

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-brand-400" /> Connect WhatsApp
                </h1>
                <p className="text-gray-400 mt-1">Link your WhatsApp account to start sending messages.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="glass rounded-2xl p-8">
                    <h2 className="font-semibold text-white mb-6">Connection Status</h2>

                    <div className="flex flex-col items-center py-6">
                        {status === 'connected' ? (
                            <div className="flex flex-col items-center animate-in fade-in duration-500">
                                <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="w-10 h-10 text-brand-500" />
                                </div>
                                <p className="text-xl font-bold text-white">WhatsApp Connected</p>
                                <p className="text-gray-400 text-sm mt-1">Ready to send OTPs</p>
                                <button
                                    onClick={() => disconnectMutation.mutate()}
                                    disabled={disconnectMutation.isPending}
                                    className="mt-8 px-6 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Disconnect Device
                                </button>
                            </div>
                        ) : status === 'connecting' ? (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                </div>
                                <p className="text-xl font-bold text-white">Connecting...</p>
                                <p className="text-gray-400 text-sm mt-1 text-center max-w-xs">
                                    Waiting for device to link. Please wait or scan the QR code.
                                </p>
                                <button
                                    onClick={() => disconnectMutation.mutate()}
                                    className="mt-8 text-gray-500 text-sm hover:text-white transition-colors"
                                >
                                    Cancel attempt
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-400">
                                    <PhoneIcon className="w-10 h-10" />
                                </div>
                                <p className="text-xl font-bold text-white">Not Connected</p>
                                <p className="text-gray-400 text-sm mt-1">Link your device to get started</p>
                                <button
                                    onClick={() => connectMutation.mutate()}
                                    disabled={connectMutation.isPending}
                                    className="mt-8 px-8 py-3 rounded-xl gradient-brand text-white font-bold hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    {connectMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    Generate QR Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Code Card */}
                {status !== 'connected' && (
                    <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center">
                        <h2 className="font-semibold text-white mb-6 w-full text-left">Scan QR Code</h2>

                        {qrCode ? (
                            <div className="p-4 bg-white rounded-2xl mb-6 shadow-xl shadow-brand-500/10 scale-in-center overflow-hidden">
                                <QRCodeSVG value={qrCode} size={256} />
                            </div>
                        ) : (
                            <div className="w-64 h-64 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-gray-600 mb-6 border-2 border-dashed border-white/10">
                                <Smartphone className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-xs">QR will appear here</p>
                            </div>
                        )}

                        <div className="space-y-3 w-full max-w-xs">
                            <div className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                                <p>Open WhatsApp on your phone</p>
                            </div>
                            <div className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                                <p>Tap Menu or Settings and select Linked Devices</p>
                            </div>
                            <div className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                                <p>Point your phone to this screen to capture the QR code</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
