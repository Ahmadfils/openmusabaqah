'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Radio, Trophy } from 'lucide-react';

const statusCopy: Record<string, { title: string; hint: string }> = {
    inactive: { title: 'Waiting for the next participant', hint: 'The judge will activate a participant shortly.' },
    waiting_batch: { title: 'Choose a question batch', hint: 'Select one of the available batches below to begin.' },
    batch_selected: { title: 'Batch selected', hint: 'The recitation is about to begin. Judges are preparing their scores.' },
    judging: { title: 'Judging in progress', hint: 'The judges are submitting their scores independently.' },
    completed: { title: 'Turn completed', hint: 'All judges have submitted. The average is now available on the leaderboard.' },
};

export default function LivePage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<number | null>(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/public/competitions/${slug}/live`, { credentials: 'same-origin' });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to load live stage');
            setData(payload);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load live stage');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, [load]);

    const selectBatch = async (batchNumber: number) => {
        setSelecting(batchNumber);
        setError('');
        try {
            const res = await fetch(`/api/public/competitions/${slug}/live`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ batchNumber }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to select this batch');
            setData(payload);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to select this batch');
            await load();
        } finally {
            setSelecting(null);
        }
    };

    const live = data?.live;
    const copy = statusCopy[live?.status || 'inactive'] || statusCopy.inactive;
    const canSelect = live?.status === 'waiting_batch' && live?.participant;
    const availableBatches = (data?.batches || []).filter((batch: any) => !batch.isUsed);

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/results" className="flex items-center gap-2 text-sm text-turquoise-400 hover:text-gold-300">
                        <ArrowLeft size={16} /> All competitions
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/leaderboard/${slug}`}
                            className="flex items-center gap-2 rounded-lg border border-gold-500/30 px-3 py-1.5 text-xs text-gold-300 hover:bg-gold-500/10"
                        >
                            <Trophy size={13} /> Leaderboard
                        </Link>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : error && !data ? (
                    <div className="glass-card p-10 text-center text-red-300">{error}</div>
                ) : data ? (
                    <>
                        <div className="text-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Live stage
                            </span>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise-500">
                                {data.competition.organizationName}
                            </p>
                            <h1 className="mt-1 text-4xl font-black text-white">{data.competition.name}</h1>
                        </div>

                        <div className="glass-card relative overflow-hidden p-8 text-center">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-turquoise-500/5 to-gold-500/5" />
                            <h2 className="relative text-2xl font-bold text-gold-300">{copy.title}</h2>
                            <p className="relative mt-2 text-sm text-turquoise-400">{copy.hint}</p>

                            {live?.participant ? (
                                <div className="relative mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">On stage</p>
                                    <p className="mt-1 text-2xl font-bold text-white">{live.participant.name}</p>
                                    <p className="mt-1 text-xs text-turquoise-400">
                                        {live.participant.groupName || 'No group'}
                                        {live.participant.identifier ? ` · ${live.participant.identifier}` : ''}
                                    </p>
                                    {live.currentBatchNumber && (
                                        <p className="mt-2 text-sm font-bold text-gold-400">Batch #{live.currentBatchNumber}</p>
                                    )}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-turquoise-500">
                                            <span>Judges submitted</span>
                                            <span>
                                                {live.submittedCount}/{live.judgeCount}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-turquoise-500 to-gold-500 transition-all"
                                                style={{ width: `${live.judgeCount ? Math.min(100, (live.submittedCount / live.judgeCount) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    {live.complete && <p className="mt-3 text-xs font-bold text-emerald-400">All judges have submitted.</p>}
                                </div>
                            ) : (
                                <p className="relative mt-6 text-sm text-turquoise-500">No participant is on stage right now.</p>
                            )}
                        </div>

                        {canSelect && (
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-white">Available batches</h3>
                                <p className="mt-1 text-xs text-turquoise-500">Select the batch to recite. Used batches cannot be selected again.</p>
                                {availableBatches.length === 0 ? (
                                    <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-turquoise-500">
                                        No batches are available for this group.
                                    </p>
                                ) : (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                        {availableBatches.map((batch: any) => (
                                            <button
                                                key={batch.batchNumber}
                                                onClick={() => selectBatch(batch.batchNumber)}
                                                disabled={selecting !== null}
                                                className="flex h-16 items-center justify-center rounded-xl border-2 border-turquoise-500/40 bg-turquoise-800/50 text-lg font-bold text-turquoise-200 transition-all hover:scale-105 hover:border-gold-400 hover:text-gold-300 disabled:opacity-50"
                                            >
                                                {selecting === batch.batchNumber ? <Loader2 size={18} className="animate-spin" /> : batch.batchNumber}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {live?.status === 'completed' && (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link href={`/leaderboard/${slug}`} className="btn-gold flex items-center gap-2 px-5 py-2 text-sm">
                                    <Trophy size={15} /> View leaderboard
                                </Link>
                                {data.competition.leaderboardVisibility === 'HIDDEN_POINTS' && (
                                    <span className="text-xs text-turquoise-500">Points are hidden by the organizer.</span>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-turquoise-600">
                            <span className="flex items-center gap-1">
                                <Radio size={12} /> Refreshes every 3 seconds
                            </span>
                            {data.competition.status === 'ACTIVE' && (
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Competition is active
                                </span>
                            )}
                        </div>

                        {error && <p className="text-center text-sm text-red-300">{error}</p>}
                    </>
                ) : null}
            </div>
        </main>
    );
}
