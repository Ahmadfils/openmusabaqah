/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function UnsubscribeClient({ initialEmail, token }: { initialEmail: string; token: string }) {
    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus('loading');
        setMessage('');
        try {
            const res = await fetch('/api/newsletter/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: token || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to unsubscribe');
            setStatus('success');
            setMessage('This email address has been removed from the newsletter list.');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to unsubscribe');
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-5 py-16">
            <div className="glass-card w-full max-w-md p-8">
                <img src="/icons/openMusabaqa-logo.svg" alt="OpenMusabaqa logo" className="h-11 w-11 rounded-xl" />
                <h1 className="mt-5 text-2xl font-black text-white">Unsubscribe from the newsletter</h1>
                <p className="mt-2 text-sm leading-relaxed text-turquoise-300/80">
                    Enter the email address that receives OpenMusabaqa updates. You will stop receiving newsletter bulletins.
                    Account and verification emails are not affected.
                </p>

                <form onSubmit={submit} className="mt-6">
                    <label htmlFor="unsubscribe-email" className="admin-label">Email address</label>
                    <input
                        id="unsubscribe-email"
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="admin-input"
                        placeholder="you@example.org"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn-gold mt-4 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" size={15} /> : 'Unsubscribe'}
                    </button>
                </form>

                {message && (
                    <p
                        className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                            status === 'success'
                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                                : 'border-red-500/25 bg-red-500/10 text-red-200'
                        }`}
                    >
                        {status === 'success' && <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
                        {message}
                    </p>
                )}

                <p className="mt-5 text-xs text-turquoise-500">
                    <Link href="/" className="underline hover:text-gold-300">Back to OpenMusabaqa</Link>
                </p>
            </div>
        </main>
    );
}
