'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Radio, Trophy, UserPlus } from 'lucide-react';

const visibilityLabel: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    PUBLIC: { label: 'Public points', icon: <Eye size={12} />, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
    HIDDEN_POINTS: { label: 'Points hidden', icon: <EyeOff size={12} />, className: 'border-gold-500/30 bg-gold-500/10 text-gold-300' },
    PRIVATE: { label: 'Members only', icon: <Lock size={12} />, className: 'border-red-500/30 bg-red-500/10 text-red-300' },
};

export default function ResultsPage() {
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/public/competitions', { credentials: 'same-origin' })
            .then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load competitions');
                return payload as any[];
            })
            .then(setCompetitions)
            .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load competitions'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="mx-auto max-w-6xl space-y-8">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 text-sm text-turquoise-400 hover:text-gold-300">
                        <ArrowLeft size={16} /> Home
                    </Link>
                    <Link href="/login" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-turquoise-400 hover:bg-white/10">
                        Sign in
                    </Link>
                </header>

                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">OpenMusabaqah</p>
                    <h1 className="mt-2 text-4xl font-black text-white">Public competitions</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-turquoise-400">
                        Follow live stages, check leaderboards, and register for competitions hosted by organizations on OpenMusabaqah.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : error ? (
                    <div className="glass-card p-8 text-center text-sm text-red-300">{error}</div>
                ) : competitions.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <Trophy size={36} className="mx-auto text-turquoise-700" />
                        <p className="mt-4 text-white font-semibold">No public competitions yet</p>
                        <p className="mt-2 text-sm text-turquoise-500">
                            Organizations can publish a competition from the admin dashboard.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {competitions.map((competition) => {
                            const visibility = visibilityLabel[competition.leaderboardVisibility] || visibilityLabel.PUBLIC;
                            return (
                                <article key={competition.id} className="glass-card flex flex-col gap-4 p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">
                                                {competition.organization?.name}
                                            </p>
                                            <h2 className="mt-1 text-2xl font-bold text-white">{competition.name}</h2>
                                            <p className="mt-1 text-xs text-turquoise-400">
                                                {competition._count?.groups ?? 0} groups · {competition._count?.participants ?? 0} participants
                                            </p>
                                        </div>
                                        <span className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${visibility.className}`}>
                                            {visibility.icon} {visibility.label}
                                        </span>
                                    </div>

                                    {competition.description && (
                                        <p className="line-clamp-3 text-sm text-turquoise-300/80">{competition.description}</p>
                                    )}

                                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                        <Link
                                            href={`/leaderboard/${competition.slug}`}
                                            className="btn-gold flex items-center gap-2 px-4 py-2 text-xs"
                                        >
                                            <Trophy size={13} /> Leaderboard
                                        </Link>
                                        <Link
                                            href={`/live/${competition.slug}`}
                                            className="flex items-center gap-2 rounded-xl border border-turquoise-500/40 bg-turquoise-500/10 px-4 py-2 text-xs font-semibold text-turquoise-200 hover:bg-turquoise-500/20"
                                        >
                                            <Radio size={13} /> Live stage
                                        </Link>
                                        {competition.publicRegistration && competition.registrationOpen && (
                                            <Link
                                                href={`/register/${competition.slug}`}
                                                className="flex items-center gap-2 rounded-xl border border-gold-500/30 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
                                            >
                                                <UserPlus size={13} /> Register
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
