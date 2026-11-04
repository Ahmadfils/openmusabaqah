'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BookOpen,
    ChevronRight,
    Loader2,
    LogOut,
    Plus,
    Save,
    Trash2,
    Trophy,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { del, errorMessage, post, put } from '@/lib/client-api';

type Criterion = { key: string; label: string; max: number; weight: number };

const statusLabel: Record<string, string> = {
    inactive: 'Inactive',
    waiting_batch: 'Waiting for batch selection',
    batch_selected: 'Batch selected',
    judging: 'Judging in progress',
    completed: 'Turn completed',
};

export default function JudgeConsole({ user }: { user: { username: string; displayName: string | null } }) {
    const router = useRouter();
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [competitionId, setCompetitionId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [workspace, setWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState('');

    const [nextParticipantId, setNextParticipantId] = useState('');
    const [liveBatch, setLiveBatch] = useState('');

    const [scoringParticipant, setScoringParticipant] = useState<any>(null);
    const [scoreBatch, setScoreBatch] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', identifier: '', groupId: '', batchNumber: '' });

    useEffect(() => {
        (async () => {
            try {
                const data = await fetch('/api/judge/competitions', { credentials: 'same-origin' }).then(async (res) => {
                    const payload = await res.json();
                    if (!res.ok) throw new Error(payload.error || 'Unable to load competitions');
                    return payload as any[];
                });
                setCompetitions(data);
                if (data[0]) setCompetitionId(data[0].id);
            } catch (err) {
                setError(errorMessage(err));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const loadWorkspace = useCallback(
        async (quiet = false) => {
            if (!competitionId) return;
            if (!quiet) setRefreshing(true);
            try {
                const res = await fetch(`/api/judge/workspace?competitionId=${competitionId}${groupId ? `&groupId=${groupId}` : ''}`, {
                    credentials: 'same-origin',
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load workspace');
                setWorkspace(payload);
                setError('');
            } catch (err) {
                if (!quiet) setError(errorMessage(err));
            } finally {
                if (!quiet) setRefreshing(false);
            }
        },
        [competitionId, groupId],
    );

    useEffect(() => {
        if (!competitionId) return;
        loadWorkspace();
        const interval = setInterval(() => loadWorkspace(true), 4000);
        return () => clearInterval(interval);
    }, [competitionId, groupId, loadWorkspace]);

    const competition = workspace?.competition;
    const participants: any[] = workspace?.participants || [];
    const batches: any[] = workspace?.batches || [];
    const liveState = workspace?.liveState;
    const activeParticipant = participants.find((participant) => participant.id === liveState?.currentParticipantId) || null;

    const criteria: Criterion[] = competition?.scoringCriteria || [];
    const pointsMode: 'FIXED' | 'PERCENT' = competition?.pointsMode || 'FIXED';
    const maxPoints = pointsMode === 'PERCENT' ? 100 : criteria.reduce((sum, criterion) => sum + criterion.max, 0);

    const batchesFor = (participant: any) =>
        batches.filter((batch) => (participant?.groupId ? batch.groupId === participant.groupId : true));

    const activeBatches = useMemo(
        () => (activeParticipant ? batchesFor(activeParticipant) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [batches, activeParticipant],
    );

    useEffect(() => {
        if (!scoringParticipant) return;
        const fresh = participants.find((participant) => participant.id === scoringParticipant.id);
        if (fresh && fresh !== scoringParticipant) setScoringParticipant(fresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participants]);

    const openScoring = (participant: any) => {
        setNotice('');
        setScoringParticipant(participant);
        setScoreBatch(participant.batchNumber ? String(participant.batchNumber) : '');
        const initial: Record<string, string> = {};
        for (const criterion of criteria) {
            const existing = participant.myScore?.criteria?.[criterion.key];
            initial[criterion.key] = existing !== undefined && existing !== null ? String(existing) : '';
        }
        setValues(initial);
        setNotes(participant.myScore?.notes || '');
    };

    const previewTotal = () => {
        let total = 0;
        const weightSum = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
        for (const criterion of criteria) {
            const value = Number(values[criterion.key] || 0);
            if (!Number.isFinite(value)) continue;
            if (pointsMode === 'PERCENT') {
                total += value * (weightSum > 0 ? criterion.weight / weightSum : 1 / criteria.length);
            } else {
                total += value;
            }
        }
        return Math.round(total * 100) / 100;
    };

    const setActiveParticipant = async () => {
        if (!nextParticipantId) {
            setError('Select a participant first.');
            return;
        }
        setBusy('active');
        setError('');
        try {
            await post('/api/live', {
                competitionId,
                currentParticipantId: nextParticipantId,
                status: 'waiting_batch',
            });
            setNextParticipantId('');
            setLiveBatch('');
            setNotice('Active participant updated.');
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const assignBatch = async () => {
        if (!liveBatch) {
            setError('Choose a batch first.');
            return;
        }
        setBusy('batch');
        setError('');
        try {
            await post('/api/live', {
                competitionId,
                currentBatchNumber: Number(liveBatch),
                status: 'judging',
            });
            setLiveBatch('');
            setNotice('Batch assigned to the active participant.');
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const updateParticipantBatch = async (participant: any, value: string) => {
        setBusy(`batch-${participant.id}`);
        setError('');
        try {
            await put('/api/judge/participants', {
                id: participant.id,
                batchNumber: value ? Number(value) : null,
            });
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const submitScore = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!scoringParticipant) return;
        setBusy('score');
        setError('');
        setNotice('');
        try {
            const payload = {
                competitionId,
                participantId: scoringParticipant.id,
                criteria: Object.fromEntries(criteria.map((criterion) => [criterion.key, Number(values[criterion.key] || 0)])),
                notes: notes.trim() || undefined,
                batchNumber: scoreBatch ? Number(scoreBatch) : undefined,
            };
            const result = await post<any>('/api/judge/score', payload);
            setNotice(
                result.completedNow
                    ? `All judges submitted. Final average: ${result.average ?? result.score.points}`
                    : `Score saved (${result.score.points} pts). Waiting for the other judges (${result.progress.submittedCount}/${result.progress.judgeCount}).`,
            );
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const addParticipant = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!addForm.name.trim()) return;
        setBusy('add');
        setError('');
        try {
            await post('/api/judge/participants', {
                competitionId,
                name: addForm.name,
                identifier: addForm.identifier || undefined,
                groupId: addForm.groupId || undefined,
                batchNumber: addForm.batchNumber ? Number(addForm.batchNumber) : undefined,
            });
            setAddForm({ name: '', identifier: '', groupId: '', batchNumber: '' });
            setShowAdd(false);
            setNotice('Participant added.');
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const removeParticipant = async (participant: any) => {
        if (!window.confirm(`Delete ${participant.name}? Their scores will also be removed.`)) return;
        setBusy(`delete-${participant.id}`);
        setError('');
        try {
            await del(`/api/judge/participants?id=${participant.id}`);
            if (scoringParticipant?.id === participant.id) setScoringParticipant(null);
            setNotice(`${participant.name} deleted.`);
            await loadWorkspace();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-turquoise-400">Loading judge console...</div>;
    }

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="glass-card flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/" className="gold-text flex items-center gap-2 font-bold">
                            <BookOpen size={16} /> OpenMusabaqah
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Competition</span>
                            <select
                                value={competitionId}
                                onChange={(event) => {
                                    setCompetitionId(event.target.value);
                                    setGroupId('');
                                    setWorkspace(null);
                                    setScoringParticipant(null);
                                }}
                                className="cursor-pointer border-b border-gold-500/30 bg-transparent px-2 py-1 text-sm font-bold text-white focus:outline-none"
                            >
                                {competitions.length === 0 && <option value="">No competitions assigned</option>}
                                {competitions.map((item) => (
                                    <option key={item.id} value={item.id} className="bg-turquoise-950">
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {competition && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Group</span>
                                <select
                                    value={groupId}
                                    onChange={(event) => setGroupId(event.target.value)}
                                    className="cursor-pointer border-b border-turquoise-700/40 bg-transparent px-2 py-1 text-sm text-white focus:outline-none"
                                >
                                    <option value="" className="bg-turquoise-950">
                                        All groups
                                    </option>
                                    {competition.groups?.map((group: any) => (
                                        <option key={group.id} value={group.id} className="bg-turquoise-950">
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-bold text-white">{user.displayName || user.username}</p>
                            <p className="text-[10px] uppercase tracking-widest text-turquoise-500">Judge</p>
                        </div>
                        <button
                            onClick={logout}
                            className="rounded-lg border border-white/10 p-2 text-turquoise-400 transition hover:bg-white/10 hover:text-white"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
                {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}

                {!competitionId ? (
                    <div className="glass-card p-10 text-center text-turquoise-400">
                        No competition is assigned to your account yet. Ask your organization admin to assign you.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="glass-card p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Live status</p>
                                <p className="mt-1 text-lg font-bold text-white">{statusLabel[liveState?.status || 'inactive']}</p>
                                <p className="mt-1 text-xs text-turquoise-400">
                                    {activeParticipant ? `Active: ${activeParticipant.name}` : 'No active participant'}
                                </p>
                            </div>
                            <div className="glass-card p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Judges scoring</p>
                                <p className="mt-1 text-lg font-bold text-white">{workspace?.judgeCount ?? 0}</p>
                                <p className="mt-1 text-xs text-turquoise-400">
                                    {(workspace?.judges || []).map((judge: any) => judge.displayName || judge.username).join(', ') || '—'}
                                </p>
                            </div>
                            <div className="glass-card p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Scoring mode</p>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {pointsMode === 'PERCENT' ? 'Percentage' : 'Fixed points'}
                                </p>
                                <p className="mt-1 text-xs text-turquoise-400">Maximum {maxPoints} pts</p>
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-3">
                            <div className="space-y-6 xl:col-span-2">
                                <div className="glass-card p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="flex items-center gap-2 font-bold text-white">
                                            <Users size={18} className="text-gold-400" /> Participants
                                        </h2>
                                        <button
                                            onClick={() => setShowAdd((value) => !value)}
                                            className="flex items-center gap-1 rounded-lg border border-gold-500/30 px-3 py-1.5 text-xs font-semibold text-gold-400 hover:bg-gold-500/10"
                                        >
                                            {showAdd ? <X size={13} /> : <UserPlus size={13} />}
                                            {showAdd ? 'Cancel' : 'Add participant'}
                                        </button>
                                    </div>

                                    {showAdd && (
                                        <form onSubmit={addParticipant} className="mb-5 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
                                            <input
                                                required
                                                placeholder="Full name"
                                                value={addForm.name}
                                                onChange={(event) => setAddForm({ ...addForm, name: event.target.value })}
                                                className="rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                            />
                                            <input
                                                placeholder="Identifier (optional)"
                                                value={addForm.identifier}
                                                onChange={(event) => setAddForm({ ...addForm, identifier: event.target.value })}
                                                className="rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                            />
                                            <select
                                                value={addForm.groupId}
                                                onChange={(event) => setAddForm({ ...addForm, groupId: event.target.value, batchNumber: '' })}
                                                className="rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                            >
                                                <option value="">No group</option>
                                                {competition?.groups?.map((group: any) => (
                                                    <option key={group.id} value={group.id} className="bg-turquoise-950">
                                                        {group.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={addForm.batchNumber}
                                                onChange={(event) => setAddForm({ ...addForm, batchNumber: event.target.value })}
                                                className="rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                            >
                                                <option value="">No batch</option>
                                                {batches
                                                    .filter((batch) => !addForm.groupId || batch.groupId === addForm.groupId)
                                                    .map((batch) => (
                                                        <option key={`${batch.groupId}-${batch.batchNumber}`} value={batch.batchNumber} className="bg-turquoise-950">
                                                            Batch #{batch.batchNumber} · {batch.groupName}
                                                        </option>
                                                    ))}
                                            </select>
                                            <button
                                                type="submit"
                                                disabled={busy !== ''}
                                                className="btn-gold flex items-center justify-center gap-2 px-4 py-2 text-sm sm:col-span-2 disabled:opacity-50"
                                            >
                                                {busy === 'add' && <Loader2 size={14} className="animate-spin" />} Add participant
                                            </button>
                                        </form>
                                    )}

                                    <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                                        {participants.length === 0 && (
                                            <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-turquoise-500">
                                                No participants in this view yet.
                                            </p>
                                        )}
                                        {participants.map((participant) => (
                                            <div
                                                key={participant.id}
                                                className={`rounded-xl border px-4 py-3 ${
                                                    participant.id === liveState?.currentParticipantId
                                                        ? 'border-emerald-500/40 bg-emerald-500/10'
                                                        : 'border-white/10 bg-white/5'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-white">
                                                            {participant.name}
                                                            {participant.identifier && (
                                                                <span className="ml-2 text-xs text-turquoise-500">({participant.identifier})</span>
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-turquoise-500">
                                                            {participant.group?.name || 'No group'} · {participant.status}
                                                            {participant.id === liveState?.currentParticipantId ? ' · LIVE' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-turquoise-300">
                                                            {participant.submittedCount}/{workspace?.judgeCount ?? 0} judges
                                                        </span>
                                                        {participant.myScore && (
                                                            <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-1 text-[10px] font-bold text-gold-300">
                                                                My score: {participant.myScore.points}
                                                            </span>
                                                        )}
                                                        <select
                                                            value={participant.batchNumber ?? ''}
                                                            onChange={(event) => updateParticipantBatch(participant, event.target.value)}
                                                            disabled={busy !== ''}
                                                            className="rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-2 py-1 text-[11px] text-white focus:outline-none disabled:opacity-40"
                                                            title="Assign batch"
                                                        >
                                                            <option value="">No batch</option>
                                                            {batchesFor(participant).map((batch) => (
                                                                <option key={`${batch.groupId}-${batch.batchNumber}`} value={batch.batchNumber} className="bg-turquoise-950">
                                                                    #{batch.batchNumber}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => openScoring(participant)}
                                                            className="rounded-lg bg-gold-500 px-3 py-1.5 text-[11px] font-bold text-gray-900 hover:brightness-110"
                                                        >
                                                            Score
                                                        </button>
                                                        <button
                                                            onClick={() => removeParticipant(participant)}
                                                            disabled={busy !== ''}
                                                            className="rounded-lg border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                                                            title="Delete participant"
                                                        >
                                                            {busy === `delete-${participant.id}` ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={13} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {participant.complete && (
                                                    <p className="mt-2 text-[11px] text-emerald-400">
                                                        All judges submitted{participant.average !== null ? ` · average ${participant.average}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-card p-6">
                                    <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
                                        <ChevronRight size={18} className="text-gold-400" /> Turn control
                                    </h2>
                                    <div className="space-y-3">
                                        <select
                                            value={nextParticipantId}
                                            onChange={(event) => setNextParticipantId(event.target.value)}
                                            className="w-full rounded-xl border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                        >
                                            <option value="">-- Select participant --</option>
                                            {participants.map((participant) => (
                                                <option key={participant.id} value={participant.id} className="bg-turquoise-950">
                                                    {participant.name}
                                                    {participant.group?.name ? ` · ${participant.group.name}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={setActiveParticipant}
                                            disabled={busy !== ''}
                                            className="btn-gold w-full px-4 py-2 text-sm disabled:opacity-50"
                                        >
                                            {busy === 'active' && <Loader2 size={14} className="mr-2 inline animate-spin" />} Set active participant
                                        </button>

                                        <div className="border-t border-white/10 pt-3">
                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-turquoise-500">Assign batch</p>
                                            <select
                                                value={liveBatch}
                                                onChange={(event) => setLiveBatch(event.target.value)}
                                                disabled={!activeParticipant}
                                                className="mb-2 w-full rounded-xl border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-40"
                                            >
                                                <option value="">-- Select batch --</option>
                                                {activeBatches.map((batch) => (
                                                    <option key={`${batch.groupId}-${batch.batchNumber}`} value={batch.batchNumber} className="bg-turquoise-950">
                                                        Batch #{batch.batchNumber} · {batch.groupName}
                                                        {batch.isUsed ? ' (used)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={assignBatch}
                                                disabled={!activeParticipant || busy !== ''}
                                                className="btn-turquoise w-full px-4 py-2 text-sm disabled:opacity-40"
                                            >
                                                {busy === 'batch' && <Loader2 size={14} className="mr-2 inline animate-spin" />} Assign batch
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
                                        <Trophy size={18} className="text-gold-400" /> Score participant
                                    </h2>
                                    {!scoringParticipant ? (
                                        <p className="text-sm text-turquoise-500">Choose a participant from the list to enter your score.</p>
                                    ) : (
                                        <form onSubmit={submitScore} className="space-y-3">
                                            <div>
                                                <p className="font-semibold text-white">{scoringParticipant.name}</p>
                                                <p className="text-[11px] text-turquoise-500">
                                                    {scoringParticipant.group?.name || 'No group'} · submitted {scoringParticipant.submittedCount}/
                                                    {workspace?.judgeCount ?? 0}
                                                </p>
                                            </div>

                                            {criteria.map((criterion) => (
                                                <div key={criterion.key}>
                                                    <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-turquoise-400">
                                                        <span>{criterion.label}</span>
                                                        <span>{pointsMode === 'PERCENT' ? '%' : `max ${criterion.max}`}</span>
                                                    </label>
                                                    <input
                                                        required
                                                        type="number"
                                                        min={0}
                                                        max={pointsMode === 'PERCENT' ? 100 : criterion.max}
                                                        step="0.01"
                                                        value={values[criterion.key] ?? ''}
                                                        onChange={(event) => setValues({ ...values, [criterion.key]: event.target.value })}
                                                        className="w-full rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                                    />
                                                </div>
                                            ))}

                                            <div>
                                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-turquoise-400">
                                                    Batch
                                                </label>
                                                <select
                                                    value={scoreBatch}
                                                    onChange={(event) => setScoreBatch(event.target.value)}
                                                    className="w-full rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                                >
                                                    <option value="">No batch</option>
                                                    {batchesFor(scoringParticipant).map((batch) => (
                                                        <option key={`${batch.groupId}-${batch.batchNumber}`} value={batch.batchNumber} className="bg-turquoise-950">
                                                            Batch #{batch.batchNumber} · {batch.groupName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-turquoise-400">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(event) => setNotes(event.target.value)}
                                                    rows={2}
                                                    className="w-full rounded-lg border border-turquoise-700/40 bg-turquoise-900/30 px-3 py-2 text-sm text-white focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border border-gold-500/20 bg-gold-500/10 px-3 py-2 text-sm">
                                                <span className="text-turquoise-300">Calculated total</span>
                                                <span className="font-bold text-gold-300">
                                                    {previewTotal()} / {maxPoints}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={busy !== ''}
                                                    className="btn-gold flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                                                >
                                                    {busy === 'score' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Submit score
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setScoringParticipant(null)}
                                                    className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
