interface Props {
    value: number;
    max: number;
    label: string;
}

export default function UsageBar({ value, max, label }: Props) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const color = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warn)' : 'var(--accent)';

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-secondary">{label}</span>
                <span className="text-sm font-semibold" style={{ color }}>
                    {value.toLocaleString()} / {max.toLocaleString()}
                </span>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${pct}%`,
                        background: pct > 80
                            ? `linear-gradient(90deg, #c0392b, var(--danger))`
                            : pct > 60
                                ? `linear-gradient(90deg, var(--warn), #f39c12)`
                                : undefined,
                    }}
                />
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>{pct}% used</div>
        </div>
    );
}
