import { CheckCircle, XCircle, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

type ToastData = ReturnType<typeof useToast>['toasts'][0];

interface Props {
    toasts: ToastData[];
    onRemove: (id: number) => void;
}

export default function Toast({ toasts, onRemove }: Props) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    {t.type === 'success'
                        ? <CheckCircle size={18} color="var(--accent)" />
                        : <XCircle size={18} color="var(--danger)" />
                    }
                    <span style={{ flex: 1, fontSize: 14 }}>{t.message}</span>
                    <button
                        className="btn-icon btn"
                        onClick={() => onRemove(t.id)}
                        style={{ padding: '2px' }}
                    >
                        <X size={14} color="var(--text-muted)" />
                    </button>
                </div>
            ))}
        </div>
    );
}
