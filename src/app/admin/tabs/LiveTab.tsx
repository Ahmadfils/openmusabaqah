'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Radio, RotateCcw, UserCheck } from 'lucide-react';
import { errorMessage, post } from '@/lib/client-api';

type LivePayload = {
    state: {
        currentParticipantId: string | null;
        currentGroupId: string | null;
        currentBatchNumber: number | null;
        status: string;
    };
    judgeCount: number;
    participant: {
        id: string;
        name: string;
        identifier: string | null;
        group?: { name: string } | null;
        submittedCount: number;
        complete: boolean;
        average: number | null;
    } | null;
};

const statusLabels: Record<string, string> = {
    inactive: 'Inactive',
    waiting_batch: 'Waiting for batch selection',
    batch_selected: 'Batch selected',
    judging: 'Judging in progress',
    completed: 'Turn completed',
};

export default function LiveTab({ competition }: { competition: any }) {
    const [live, setLive] = useState<LivePayload | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [participantId, setParticipantId] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');

    const competitionId = competition.id;
    const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const loadLive = useCallback(async () => {
        try {
            const res = await fetch(`/api/live?competitionId=${competitionId}`, { credentials: 'same-origin' });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to load live state');
            setLive(payload);
        } catch (err) {
            setError(errorMessage(err));
        }
    }, [competitionId]);

    const loadSetup = useCallback(async () => {
        try {
            const [participantRes, questionRes] = await Promise.all([
                fetch(`/api/admin/participants?competitionId=${competitionId}&status=APPROVED`, { credentials: 'same-origin' }),
                fetch(`/api/admin/questions?competitionId=${competitionId}`, { credentials: 'same-origin' }),
            ]);
            if (participantRes.ok) setParticipants(await participantRes.json());
            if (questionRes.ok) setQuestions(await questionRes.json());
        } catch (err) {
            setError(errorMessage(err));
        }
    }, [competitionId]);

    useEffect(() => {
        loadLive();
        loadSetup();
        const interval = setInterval(loadLive, 3000);
        return () => clearInterval(interval);
    }, [loadLive, loadSetup]);

    const active = live?.participant || null;
    const activeParticipant = participants.find((participant) => participant.id === (live?.state.currentParticipantId || participantId));

    const batches = useMemo(() => {
        const groupId = active?.id ? participants.find((p) => p.id === active.id)?.groupId : activeParticipant?.groupId;
        const numbers = new Set<number>();
        questions
            .filter((question) => !groupId || question.groupId === groupId)
            .forEach((question) => numbers.add(question.number));
        return Array.from(numbers).sort((a, b) => a - b);
    }, [questions, participants, active, activeParticipant]);

    const setActive = async () => {
        if (!participantId) {
            setError('Select a participant first.');
            return;
        }
        setBusy('participant');
        setError('');
        try {
            const payload = await post<LivePayload>('/api/live', {
                competitionId,
                currentParticipantId: participantId,
                status: 'waiting_batch',
            });
            setLive(payload);
            setParticipantId('');
            setBatchNumber('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const applyBatch = async () => {
        if (!batchNumber) {
            setError('Choose a batch number.');
            return;
        }
        setBusy('batch');
        setError('');
        try {
            const payload = await post<LivePayload>('/api/live', {
                competitionId,
                currentBatchNumber: Number(batchNumber),
                status: 'judging',
            });
            setLive(payload);
            setBatchNumber('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const clearParticipant = async () => {
        setBusy('clear');
        setError('');
        try {
            const payload = await post<LivePayload>('/api/live', {
                competitionId,
                currentParticipantId: null,
            });
            setLive(payload);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const resetAll = async () => {
        if (!window.confirm('Reset the live stage? The active participant and selected batch will be cleared.')) return;
        setBusy('reset');
        setError('');
        try {
            const payload = await post<LivePayload>('/api/live', { competitionId, reset: true });
            setLive(payload);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="glass-card p-6 lg:col-span-2">
                    <h2 className="mb-4 flex items-center gap-2 text-white font-bold">
                        <Radio size={18} className="text-gold-400" /> Live stage
                    </h2>
                    <div className="space-y-4 text-sm">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Status</p>
                            <p className="mt-1 text-lg font-bold text-white">
                                {statusLabels[live?.state.status || 'inactive'] || live?.state.status || 'Loading...'}
                            </p>
                            {active && (
                                <p className="mt-1 text-turquoise-300">
                                    {active.name}
                                    {active.identifier ? ` (${active.identifier})` : ''}
                                    {active.group?.name ? ` · ${active.group.name}` : ''}
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Judge progress</p>
                            {active ? (
                                <>
                                    <p className="mt-1 text-white font-bold">
                                        {active.submittedCount} / {live?.judgeCount ?? 0} submitted
                                    </p>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-turquoise-500 to-gold-500 transition-all"
                                            style={{
                                                width: `${live?.judgeCount ? Math.min(100, (active.submittedCount / live.judgeCount) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-turquoise-400">
                                        {active.complete
                                            ? `All judges submitted. Average: ${active.average ?? 0}`
                                            : 'Waiting for the remaining judges.'}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-1 text-turquoise-500">No participant is active.</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={clearParticipant}
                                disabled={!live?.state.currentParticipantId || busy !== ''}
                                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
                            >
                                {busy === 'clear' ? <Loader2 size={14} className="animate-spin" /> : 'Clear participant'}
                            </button>
                            <button
                                onClick={resetAll}
                                disabled={busy !== ''}
                                className="flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                            >
                                {busy === 'reset' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reset stage
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-3">
                    <div className="glass-card p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-white font-bold">
                            <UserCheck size={18} className="text-gold-400" /> Set the active participant
                        </h3>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={participantId}
                                onChange={(event) => setParticipantId(event.target.value)}
                                className="w-full rounded-xl border border-turquoise-700/40 bg-turquoise-900/30 px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50"
                            >
                                <option value="">-- Select approved participant --</option>
                                {participants.map((participant) => (
                                    <option key={participant.id} value={participant.id} className="bg-turquoise-950">
                                        {participant.name}
                                        {participant.identifier ? ` (${participant.identifier})` : ''}
                                        {participant.group?.name ? ` · ${participant.group.name}` : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={setActive}
                                disabled={busy !== ''}
                                className="btn-gold flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-sm disabled:opacity-50"
                            >
                                {busy === 'participant' && <Loader2 size={14} className="animate-spin" />} Set active
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-turquoise-500">
                            Judges see this participant as soon as they submit their scores. The turn completes when the last assigned
                            judge submits.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="mb-4 text-white font-bold">Assign a batch</h3>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={batchNumber}
                                onChange={(event) => setBatchNumber(event.target.value)}
                                disabled={!live?.state.currentParticipantId}
                                className="w-full rounded-xl border border-turquoise-700/40 bg-turquoise-900/30 px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
                            >
                                <option value="">-- Select batch --</option>
                                {batches.map((number) => (
                                    <option key={number} value={number} className="bg-turquoise-950">
                                        Batch #{number}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={applyBatch}
                                disabled={!live?.state.currentParticipantId || busy !== ''}
                                className="btn-turquoise flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-sm disabled:opacity-40"
                            >
                                {busy === 'batch' && <Loader2 size={14} className="animate-spin" />} Assign
                            </button>
                        </div>
                        {live?.state.currentBatchNumber && (
                            <p className="mt-3 text-xs text-turquoise-400">
                                Current batch: <span className="font-bold text-gold-400">#{live.state.currentBatchNumber}</span>
                            </p>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="mb-4 text-white font-bold">Public pages</h3>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {[
                                { href: `/live/${competition.slug}`, label: 'Live stage' },
                                { href: `/leaderboard/${competition.slug}`, label: 'Leaderboard' },
                                { href: `/register/${competition.slug}`, label: 'Registration' },
                            ].map((link) => (
                                <a
                                    key={link.href}
                                    href={`${base}${link.href}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-turquoise-300 hover:bg-white/10"
                                >
                                    {link.label} <ExternalLink size={12} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
