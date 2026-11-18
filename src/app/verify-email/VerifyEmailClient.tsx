'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error' | 'missing';

export default function VerifyEmailClient() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get('token');
    const [status, setStatus] = useState<Status>(token ? 'verifying' : 'missing');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState('');

    const verify = useCallback(async (value: string) => {
        setStatus('verifying');
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: value }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to verify this link');
            setStatus('success');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to verify this link');
        }
    }, []);

    useEffect(() => {
        if (token) verify(token);
    }, [token, verify]);

    const resend = async (event: React.FormEvent) => {
        event.preventDefault();
        setResending(true);
        setResent('');
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to resend the verification email');
            setResent(
                data.verificationUrl
                    ? `Development link: ${data.verificationUrl}`
                    : 'If this email belongs to an unverified organization, a new link is on its way.',
            );
        } catch (error) {
            setResent(error instanceof Error ? error.message : 'Unable to resend the verification email');
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-sm text-turquoise-400 hover:text-gold-300">
                    <ArrowLeft size={15} /> Back to OpenMusabaqa
                </Link>

                <div className="glass-card p-8 text-center">
                    {status === 'verifying' && (
                        <>
                            <Loader2 className="mx-auto animate-spin text-gold-500" size={40} />
                            <h1 className="mt-5 text-2xl font-black text-white">Verifying your organization</h1>
                            <p className="mt-2 text-sm text-turquoise-400">This will only take a moment.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
                            <h1 className="mt-5 text-2xl font-black text-white">Email verified</h1>
                            <p className="mt-2 text-sm text-turquoise-400">
                                Your organization is active. Sign in with the admin username you chose during registration.
                            </p>
                            <button onClick={() => router.push('/login?verified=1')} className="btn-gold mt-6 px-6 py-3 text-sm">
                                Continue to sign in
                            </button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="mx-auto text-red-400" size={48} />
                            <h1 className="mt-5 text-2xl font-black text-white">Link not valid</h1>
                            <p className="mt-2 text-sm text-red-300">{message}</p>
                            <p className="mt-4 text-sm text-turquoise-400">You can request a fresh verification link below.</p>
                        </>
                    )}

                    {status === 'missing' && (
                        <>
                            <Mail className="mx-auto text-gold-400" size={44} />
                            <h1 className="mt-5 text-2xl font-black text-white">Verify your email</h1>
                            <p className="mt-2 text-sm text-turquoise-400">
                                Open the verification link from your inbox, or request a new one with your organization email.
                            </p>
                        </>
                    )}

                    {(status === 'error' || status === 'missing') && (
                        <form onSubmit={resend} className="mt-6 space-y-3 text-left">
                            <label className="admin-label">Organization email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="admin-input"
                                placeholder="contact@example.org"
                            />
                            <button type="submit" disabled={resending} className="btn-turquoise flex w-full items-center justify-center gap-2 py-3 text-sm">
                                {resending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Resend verification email
                            </button>
                            {resent && <p className="break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-turquoise-300">{resent}</p>}
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-turquoise-600">
                    Need help? Contact <span className="text-turquoise-400">support@openmusabaqa.org</span>
                </p>
            </div>
        </main>
    );
}
