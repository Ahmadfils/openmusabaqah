'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, Plus, Power, ShieldCheck, ShieldOff, UserPlus, X } from 'lucide-react';
import { del, errorMessage, post, put } from '@/lib/client-api';

export default function JudgesTab({
    competition,
    onChanged,
}: {
    competition: any;
    onChanged: () => Promise<void> | void;
}) {
    const [judges, setJudges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [credentials, setCredentials] = useState<{ username: string; password: string; title: string } | null>(null);
    const [resetTarget, setResetTarget] = useState<any>(null);
    const [resetValue, setResetValue] = useState('');
    const [form, setForm] = useState({
        displayName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        assign: true,
    });

    const fetchJudges = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetch('/api/admin/judges', { credentials: 'same-origin' }).then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load judges');
                return payload as any[];
            });
            setJudges(data);
            setError('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJudges();
    }, [fetchJudges]);

    const isAssigned = (judge: any) =>
        judge.judgeAssignments?.some((assignment: any) => assignment.competition?.id === competition.id && assignment.isActive);

    const create = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const result = await post('/api/admin/judges', {
                displayName: form.displayName,
                username: form.username || undefined,
                password: form.password || undefined,
                email: form.email || undefined,
                phone: form.phone || undefined,
                competitionIds: form.assign ? [competition.id] : [],
            });
            setCredentials({
                title: 'Judge account created',
                username: result.judge.username,
                password: result.generatedPassword || form.password,
            });
            setForm({ displayName: '', username: '', password: '', email: '', phone: '', assign: true });
            await fetchJudges();
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const toggleAssignment = async (judge: any) => {
        setBusy(true);
        setError('');
        try {
            if (isAssigned(judge)) {
                await del(`/api/admin/assignments?competitionId=${competition.id}&judgeId=${judge.id}`);
            } else {
                await post('/api/admin/assignments', { competitionId: competition.id, judgeId: judge.id });
            }
            await fetchJudges();
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const toggleActive = async (judge: any) => {
        setBusy(true);
        setError('');
        try {
            await put(`/api/admin/judges/${judge.id}`, { isActive: !judge.isActive });
            await fetchJudges();
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const resetPassword = async () => {
        if (!resetTarget) return;
        setBusy(true);
        setError('');
        try {
            const payload = resetValue ? { password: resetValue } : { resetPassword: true };
            const result = await put(`/api/admin/judges/${resetTarget.id}`, payload);
            if (result.generatedPassword) {
                setCredentials({
                    title: 'Password reset',
                    username: result.judge.username,
                    password: result.generatedPassword,
                });
            } else {
                setCredentials({
                    title: 'Password updated',
                    username: result.judge.username,
                    password: resetValue,
                });
            }
            setResetTarget(null);
            setResetValue('');
            await fetchJudges();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const copyCredentials = async () => {
        if (!credentials) return;
        await navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`).catch(() => undefined);
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={create} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <UserPlus size={18} className="text-gold-400" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Create judge</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    <div>
                        <label className="admin-label">Display name *</label>
                        <input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="admin-input" required />
                    </div>
                    <div>
                        <label className="admin-label">Username (optional)</label>
                        <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="admin-input" placeholder="Auto-generated" />
                    </div>
                    <div>
                        <label className="admin-label">Password (optional)</label>
                        <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="admin-input" placeholder="Auto-generated" />
                    </div>
                    <div>
                        <label className="admin-label">Email</label>
                        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Phone</label>
                        <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="admin-input" />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-5">
                    <label className="flex items-center gap-2 text-sm text-white">
                        <input type="checkbox" checked={form.assign} onChange={(event) => setForm({ ...form, assign: event.target.checked })} className="accent-gold-500 w-4 h-4" />
                        Assign to this competition
                    </label>
                    <button type="submit" disabled={busy} className="btn-gold px-5 py-2.5 text-sm flex items-center gap-2">
                        {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Create judge
                    </button>
                </div>
            </form>

            {credentials && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">{credentials.title} — save these now</p>
                            <p className="text-white font-mono mt-2">Username: <strong>{credentials.username}</strong></p>
                            <p className="text-white font-mono">Password: <strong>{credentials.password}</strong></p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={copyCredentials} className="text-emerald-300 hover:text-emerald-200 p-2"><Copy size={17} /></button>
                            <button onClick={() => setCredentials(null)} className="text-emerald-300 hover:text-emerald-200 p-2"><X size={17} /></button>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

            {loading ? (
                <div className="glass-card p-12 flex justify-center"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
            ) : judges.length === 0 ? (
                <div className="glass-card p-12 text-center text-turquoise-600">No judges in this organization yet.</div>
            ) : (
                <div className="space-y-3">
                    {judges.map((judge) => {
                        const assigned = isAssigned(judge);
                        return (
                            <div key={judge.id} className="glass-card p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-white font-black">{judge.displayName || judge.username}</h3>
                                        <span className="text-xs text-turquoise-500 font-mono">@{judge.username}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${judge.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                                            {judge.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                        {assigned && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/20">
                                                Assigned
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-turquoise-400/70 mt-1">
                                        {judge.email || 'No email'}{judge.phone ? ` · ${judge.phone}` : ''}
                                    </p>
                                    <p className="text-[10px] text-turquoise-600 mt-1">
                                        {judge.judgeAssignments?.length
                                            ? judge.judgeAssignments.map((assignment: any) => assignment.competition?.name).filter(Boolean).join(', ')
                                            : 'No competition assignments'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => toggleAssignment(judge)}
                                        disabled={busy || !judge.isActive}
                                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border transition-colors ${
                                            assigned
                                                ? 'bg-gold-500/15 border-gold-500/30 text-gold-300 hover:bg-gold-500/25'
                                                : 'bg-white/5 border-white/10 text-turquoise-300 hover:text-white'
                                        } disabled:opacity-40`}
                                    >
                                        {assigned ? 'Unassign' : 'Assign'}
                                    </button>
                                    <button onClick={() => setResetTarget(judge)} className="text-turquoise-400 hover:text-white p-2" title="Reset password"><KeyRound size={17} /></button>
                                    <button onClick={() => toggleActive(judge)} className={`p-2 ${judge.isActive ? 'text-red-400/70 hover:text-red-300' : 'text-emerald-300 hover:text-emerald-200'}`} title={judge.isActive ? 'Disable access' : 'Enable access'}>
                                        {judge.isActive ? <ShieldOff size={17} /> : <ShieldCheck size={17} />}
                                    </button>
                                    <Power size={14} className="text-turquoise-700" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {resetTarget && (
                <div className="fixed inset-0 z-50 bg-turquoise-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-card p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-white">Reset password</h2>
                            <button onClick={() => setResetTarget(null)} className="text-turquoise-400 hover:text-white"><X size={19} /></button>
                        </div>
                        <p className="text-sm text-turquoise-400 mb-4">For <strong className="text-white">{resetTarget.displayName || resetTarget.username}</strong>. Leave blank to generate a secure password.</p>
                        <input value={resetValue} onChange={(event) => setResetValue(event.target.value)} className="admin-input" placeholder="New password (optional)" />
                        <div className="flex gap-3 mt-5">
                            <button onClick={resetPassword} disabled={busy} className="btn-gold flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                                {busy ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />} Reset & revoke sessions
                            </button>
                            <button onClick={() => setResetTarget(null)} className="btn-turquoise flex-1 py-2.5 text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
