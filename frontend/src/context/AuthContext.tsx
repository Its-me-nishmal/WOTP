import { type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

// Adapter to make legacy AuthContext consumers work with Zustand store
export function useAuth() {
    const { user, logout, token } = useAuthStore();

    const refreshUser = async () => {
        try {
            const api = await import('../services/api');
            const updatedUser = await api.authApi.getMe();
            useAuthStore.getState().setUser(updatedUser);
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    };

    return {
        user,
        loading: false, // Zustand persist is synchronous-ish
        isAuthenticated: !!token,
        refreshUser,
        login: async () => {
            try {
                // In production, we should use googleLogin. 
                // For now, we attempt devLogin but handle the production error gracefully.
                const api = await import('../services/api');

                // Strictly respect VITE_USE_DEV_LOGIN if it is set. 
                // If not set, default to DEV status.
                const envValue = import.meta.env.VITE_USE_DEV_LOGIN;
                const isDevMode = envValue === 'true' || (import.meta.env.DEV && envValue !== 'false');

                if (isDevMode) {
                    const { accessToken, user } = await api.authApi.devLogin();
                    useAuthStore.getState().setAuth(accessToken, user);
                } else {
                    alert('Identity: Production mode detected. Google OAuth must be used.');
                }
            } catch (error: any) {
                console.error('Login failed', error);
                const msg = error.response?.data?.error || error.message;
                alert(`Login failed: ${msg}`);
            }
        },
        googleLogin: async (idToken: string) => {
            try {
                const api = await import('../services/api');
                const { accessToken, user } = await api.authApi.googleLogin(idToken);
                useAuthStore.getState().setAuth(accessToken, user);
            } catch (error: any) {
                console.error('Google login failed', error);
                const msg = error.response?.data?.error || error.message;
                alert(`Google Login failed: ${msg}`);
            }
        },
        logout
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // No-op provider since state is global in Zustand
    return <>{children}</>;
}
