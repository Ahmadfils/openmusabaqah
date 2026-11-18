'use client';

import { useEffect, useRef, useState } from 'react';

export default function StatCounter({ value, suffix }: { value: string; suffix: string | null }) {
    const numeric = Number(value.replace(/[^0-9.]/g, ''));
    const decimals = value.includes('.') ? 1 : 0;
    const [display, setDisplay] = useState(() => (Number.isFinite(numeric) ? '0' : value));
    const frame = useRef<number | null>(null);

    useEffect(() => {
        if (!Number.isFinite(numeric)) return;
        const start = performance.now();
        const duration = 1100;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numeric * eased;
            setDisplay(
                new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(current),
            );
            if (progress < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => {
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, [numeric, decimals]);

    return (
        <span>
            {display}
            {suffix}
        </span>
    );
}
