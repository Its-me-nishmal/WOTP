import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const navigate = useNavigate()
    const { token, setAuth } = useAuthStore()

    useEffect(() => {
        if (token) navigate('/dashboard', { replace: true })
    }, [token, navigate])

    const handleGoogleLogin = () => {
        toast.error('Google Login requires valid credentials configuration. Use Dev Login for testing.')
    }

    const handleDevLogin = async () => {
        try {
            const data = await authApi.devLogin();
            setAuth(data.accessToken, data.user);
            toast.success('Logged in as Developer');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            toast.error('Login failed');
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
                        <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">WOTP</h1>
                    <p className="text-gray-400 mt-2 text-sm">WhatsApp OTP Platform</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
                    <p className="text-gray-400 text-sm mb-8">Sign in to your developer dashboard</p>

                    <button
                        id="google-login-btn"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {/* Google SVG icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-gray-200 opacity-20"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR TEST MODE</span>
                        <div className="flex-grow border-t border-gray-200 opacity-20"></div>
                    </div>

                    <button
                        onClick={handleDevLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-700"
                    >
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        Dev Login (No Credentials)
                    </button>

                    <p className="text-gray-500 text-xs text-center mt-6">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <p className="text-gray-600 text-xs text-center mt-6">
                    Don't have an account? Signing in automatically creates one. It's free.
                </p>
            </div>
        </div>
    )
}
