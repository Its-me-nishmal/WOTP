import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import WhatsApp from './pages/WhatsApp';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Docs from './pages/Docs';
import Playground from './pages/Playground';

import { ToastProvider } from './context/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<Login />} />

                            <Route path="/dashboard" element={
                                <ProtectedRoute><Dashboard /></ProtectedRoute>
                            } />
                            <Route path="/api-keys" element={
                                <ProtectedRoute><ApiKeys /></ProtectedRoute>
                            } />
                            <Route path="/whatsapp" element={
                                <ProtectedRoute><WhatsApp /></ProtectedRoute>
                            } />
                            <Route path="/logs" element={
                                <ProtectedRoute><Logs /></ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                                <ProtectedRoute><Settings /></ProtectedRoute>
                            } />
                            <Route path="/docs" element={<Docs />} />
                            <Route path="/playground" element={
                                <ProtectedRoute><Playground /></ProtectedRoute>
                            } />
                        </Routes>
                    </BrowserRouter>
                </ToastProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
