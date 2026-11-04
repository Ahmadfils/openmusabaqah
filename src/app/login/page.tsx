'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, LockKeyhole, UserRound } from 'lucide-react';

const roleHome: Record<string, string> = {
    SUPERADMIN: '/superadmin',
    ADMIN: '/admin',
    JUDGE: '/judge',
};

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (data.user) router.replace(roleHome[data.user.role] ?? '/');
                else setChecking(false);
            })
            .catch(() => setChecking(false));
        return () => {
            cancelled = true;
        };
    }, [router]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to sign in');
            router.replace(data.redirectTo || roleHome[data.user?.role] || '/');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-gold-500" size={36} />
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-turquoise-500 to-gold-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <BookOpen size={22} className="text-white" />
                    </div>
                    <div>
                        <p className="gold-text text-2xl font-black">OpenMusabaqah</p>
                        <p className="text-turquoise-500 text-[10px] uppercase tracking-[0.25em]">Competition platform</p>
                    </div>
                </Link>

                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Sign in</h1>
                        <p className="text-turquoise-400 text-sm mt-2">Administrators and judges use the same login.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="admin-label">Username</label>
                            <div className="relative">
                                <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                <input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    autoComplete="username"
                                    required
                                    className="admin-input w-full pl-11"
                                    placeholder="your.username"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="admin-label">Password</label>
                            <div className="relative">
                                <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="admin-input w-full pl-11"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

                        <button type="submit" disabled={loading} className="btn-gold w-full py-3 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enter portal'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-turquoise-400">
                        New organization?{' '}
                        <Link href="/signup" className="text-gold-400 hover:text-gold-300 font-semibold">
                            Create an account
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-turquoise-700 mt-6">
                    <Link href="/results" className="hover:text-turquoise-400">Browse public leaderboards</Link>
                </p>
            </div>
        </main>
    );
}
