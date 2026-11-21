'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import SectionHeading from './SectionHeading';

export default function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus('loading');
        setMessage('');
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, consent, source: 'landing_page' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to subscribe');
            setStatus('success');
            setMessage('You are on the list. Competition updates and bulletins will arrive in your inbox.');
            setEmail('');
            setConsent(false);
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to subscribe');
        }
    };

    return (
        <section id="newsletter" className="border-y border-white/5 bg-white/[0.02]">
            <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 md:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <SectionHeading
                    eyebrow="Newsletter"
                    title="Competition updates, once a month"
                    description="New competitions, registration windows and platform releases. No spam, unsubscribe at any time."
                />

                <form onSubmit={submit} className="glass-card p-5">
                    <label htmlFor="newsletter-email" className="admin-label">Email address</label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                            <input
                                id="newsletter-email"
                                required
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="admin-input pl-11"
                                placeholder="you@example.org"
                            />
                        </div>
                        <button type="submit" disabled={status === 'loading'} className="btn-gold flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60">
                            {status === 'loading' ? <Loader2 className="animate-spin" size={15} /> : 'Subscribe'}
                        </button>
                    </div>
                    <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-turquoise-300/80">
                        <input
                            type="checkbox"
                            required
                            checked={consent}
                            onChange={(event) => setConsent(event.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-gold-500"
                        />
                        <span>I agree to receive occasional competition updates by email. I can unsubscribe at any time.</span>
                    </label>
                    {message && (
                        <p
                            className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                                status === 'success'
                                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                                    : 'border-red-500/25 bg-red-500/10 text-red-200'
                            }`}
                        >
                            {status === 'success' && <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
                            {message}
                        </p>
                    )}
                    <p className="mt-3 text-[11px] text-turquoise-500">
                        Already subscribed? <Link href="/unsubscribe" className="underline hover:text-gold-300">Unsubscribe</Link>
                    </p>
                </form>
            </div>
        </section>
    );
}
