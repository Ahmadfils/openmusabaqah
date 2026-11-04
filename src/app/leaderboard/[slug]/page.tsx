'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, EyeOff, Loader2, Lock, Medal, Radio, UserPlus } from 'lucide-react';

export default function LeaderboardPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const [data, setData] = useState<any>(null);
    const [competition, setCompetition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [denied, setDenied] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/public/competitions/${slug}/leaderboard`, { credentials: 'same-origin' });
            const payload = await res.json();
            if (res.status === 401 || res.status === 403) {
                setDenied(true);
                setError(payload.error || 'This leaderboard is private');
                return;
            }
            if (!res.ok) throw new Error(payload.error || 'Unable to load leaderboard');
            setDenied(false);
            setData(payload);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        load();
        fetch(`/api/public/competitions/${slug}`)
            .then((res) => (res.ok ? res.json() : null))
            .then(setCompetition)
            .catch(() => undefined);
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [slug, load]);

    const hidden = data?.competition?.leaderboardVisibility === 'HIDDEN_POINTS';

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="mx-auto max-w-4xl space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/results" className="flex items-center gap-2 text-sm text-turquoise-400 hover:text-gold-300">
                        <ArrowLeft size={16} /> All competitions
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/live/${slug}`}
                            className="flex items-center gap-2 rounded-lg border border-turquoise-500/30 px-3 py-1.5 text-xs text-turquoise-300 hover:bg-turquoise-500/10"
                        >
                            <Radio size={13} /> Live stage
                        </Link>
                        {competition?.publicRegistration && competition?.registrationOpen && (
                            <Link
                                href={`/register/${slug}`}
                                className="flex items-center gap-2 rounded-lg border border-gold-500/30 px-3 py-1.5 text-xs text-gold-300 hover:bg-gold-500/10"
                            >
                                <UserPlus size={13} /> Register
                            </Link>
                        )}
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : denied ? (
                    <div className="glass-card mx-auto max-w-md p-10 text-center">
                        <Lock size={36} className="mx-auto text-gold-500" />
                        <h1 className="mt-4 text-2xl font-bold text-white">Private leaderboard</h1>
                        <p className="mt-2 text-sm text-turquoise-400">Sign in with an account from this organization to view the standings.</p>
                        <Link href="/login" className="btn-gold mt-6 inline-block px-6 py-2 text-sm">
                            Sign in
                        </Link>
                    </div>
                ) : error && !data ? (
                    <div className="glass-card p-10 text-center text-red-300">{error}</div>
                ) : data ? (
                    <>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise-500">
                                {data.competition.organizationName}
                            </p>
                            <h1 className="mt-1 text-4xl font-black text-white">{data.competition.name}</h1>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-turquoise-400">
                                <span>{data.rows.length} participants</span>
                                <span>·</span>
                                <span>{data.judgeCount} active judges</span>
                                {hidden && (
                                    <span className="flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-gold-300">
                                        <EyeOff size={11} /> Points are hidden
                                    </span>
                                )}
                            </div>
                        </div>

                        {data.rows.length === 0 ? (
                            <div className="glass-card p-12 text-center text-sm text-turquoise-500">
                                No approved participants yet.
                            </div>
                        ) : (
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-turquoise-500">
                                        <tr>
                                            {!hidden && <th className="px-4 py-3">Rank</th>}
                                            <th className="px-4 py-3">Participant</th>
                                            <th className="px-4 py-3">Group</th>
                                            <th className="px-4 py-3">Participation</th>
                                            {!hidden && <th className="px-4 py-3 text-right">Average</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rows.map((row: any) => (
                                            <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                                {!hidden && (
                                                    <td className="px-4 py-3">
                                                        {row.rank ? (
                                                            <span
                                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                                    row.rank === 1
                                                                        ? 'bg-gold-500 text-gray-900'
                                                                        : row.rank === 2
                                                                          ? 'bg-slate-300 text-slate-900'
                                                                          : row.rank === 3
                                                                            ? 'bg-amber-700 text-white'
                                                                            : 'border border-white/10 text-turquoise-400'
                                                                }`}
                                                            >
                                                                {row.rank}
                                                            </span>
                                                        ) : (
                                                            <span className="text-turquoise-700">—</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-white">{row.name}</p>
                                                    <p className="font-mono text-[10px] text-turquoise-600">{row.registrationCode}</p>
                                                </td>
                                                <td className="px-4 py-3 text-turquoise-300">{row.groupName || '—'}</td>
                                                <td className="px-4 py-3">
                                                    {row.complete ? (
                                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                                                            Judged
                                                        </span>
                                                    ) : row.submittedCount > 0 ? (
                                                        <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-1 text-[10px] font-bold text-gold-300">
                                                            In progress {row.submittedCount}/{row.judgeCount}
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-turquoise-500">
                                                            Not yet
                                                        </span>
                                                    )}
                                                </td>
                                                {!hidden && (
                                                    <td className="px-4 py-3 text-right">
                                                        {row.average !== null ? (
                                                            <span className="inline-flex items-center gap-1 font-mono text-base font-bold text-gold-300">
                                                                <Medal size={13} /> {row.average}
                                                            </span>
                                                        ) : (
                                                            <span className="text-turquoise-700">—</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p className="text-center text-[10px] uppercase tracking-widest text-turquoise-700">
                            Updates every 5 seconds · Last refresh {new Date(data.updatedAt).toLocaleTimeString('en-GB')}
                        </p>
                    </>
                ) : null}
            </div>
        </main>
    );
}
