import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const { login, googleLogin, user, loading } = useAuth();
    const navigate = useNavigate();

    const isDevMode = import.meta.env.VITE_USE_DEV_LOGIN === 'true' || (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_LOGIN !== 'false');

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-mark" style={{ width: 48, height: 48, fontSize: 24 }}>W</div>
                    <div className="text-3xl font-bold">WOTP</div>
                </div>

                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-sub">Sign in to manage your WhatsApp OTPs</p>

                <div className="flex flex-col gap-4 items-center">
                    <GoogleLogin
                        onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                                googleLogin(credentialResponse.credential);
                            }
                        }}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        useOneTap
                        theme="filled_blue"
                        shape="pill"
                        width="100%"
                    />

                    {isDevMode && (
                        <button
                            className="text-xs text-secondary underline hover:text-primary transition-colors"
                            onClick={login}
                        >
                            Or use Developer Mode
                        </button>
                    )}
                </div>

                <p className="text-center text-xs text-secondary mt-8 leading-5">
                    By continuing, you agree to our Terms of Service <br />
                    and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
