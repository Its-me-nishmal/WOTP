import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/ui/Toast';

interface ToastItem {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextType {
    show: (message: any, type?: 'success' | 'error') => void;
    remove: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const show = useCallback((message: any, type: 'success' | 'error' = 'success') => {
        let displayMessage = '';

        if (typeof message === 'string') {
            displayMessage = message;
        } else if (Array.isArray(message)) {
            // Handle Zod/Validation error arrays
            displayMessage = message[0]?.message || message[0]?.error || JSON.stringify(message[0]);
        } else if (typeof message === 'object' && message !== null) {
            // Handle single error objects
            displayMessage = message.message || message.error || JSON.stringify(message);
        } else {
            displayMessage = String(message);
        }

        const id = ++_id;
        setToasts(prev => [...prev, { id, message: displayMessage, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ show, remove }}>
            {children}
            <Toast toasts={toasts} onRemove={remove} />
        </ToastContext.Provider>
    );
}

export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};
