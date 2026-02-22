import { useToastContext } from '../context/ToastContext';

export function useToast() {
    const { show, remove } = useToastContext();
    return { show, remove };
}
