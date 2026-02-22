import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
    value: string;
    masked?: boolean;
}

export default function CopyField({ value, masked = false }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const display = !value ? '' : masked
        ? value.slice(0, 8) + '•'.repeat(24) + value.slice(-4)
        : value;

    return (
        <div className="copy-field">
            <span className="copy-field-value font-mono">{display}</span>
            <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                style={{ gap: 4, flexShrink: 0 }}
            >
                {copied ? <Check size={13} color="var(--accent)" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}
