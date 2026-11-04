'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Edit3, Loader2, Plus, Save, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { del, errorMessage, post, put } from '@/lib/client-api';

type ParticipantForm = {
    name: string;
    identifier: string;
    age: string;
    country: string;
    city: string;
    phone: string;
    groupId: string;
    batchNumber: string;
    status: string;
};

const emptyForm: ParticipantForm = {
    name: '',
    identifier: '',
    age: '',
    country: '',
    city: '',
    phone: '',
    groupId: '',
    batchNumber: '',
    status: 'APPROVED',
};

function toPayload(form: ParticipantForm) {
    return {
        name: form.name,
        identifier: form.identifier || null,
        age: form.age === '' ? null : Number(form.age),
        country: form.country || null,
        city: form.city || null,
        phone: form.phone || null,
        groupId: form.groupId || null,
        batchNumber: form.batchNumber === '' ? null : Number(form.batchNumber),
        status: form.status,
    };
}

export default function ParticipantsTab({
    competition,
    onChanged,
}: {
    competition: any;
    onChanged: () => Promise<void> | void;
}) {
    const groups = competition.groups || [];
    const [participants, setParticipants] = useState<any[]>([]);
    const [groupId, setGroupId] = useState('');
    const [status, setStatus] = useState('');
    const [form, setForm] = useState<ParticipantForm>({ ...emptyForm, groupId: groups[0]?.id || '' });
    const [editing, setEditing] = useState<any>(null);
    const [editForm, setEditForm] = useState<ParticipantForm>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ competitionId: competition.id });
            if (groupId) params.set('groupId', groupId);
            if (status) params.set('status', status);
            const data = await fetch(`/api/admin/participants?${params.toString()}`, { credentials: 'same-origin' }).then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load participants');
                return payload as any[];
            });
            setParticipants(data);
            setError('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [competition.id, groupId, status]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const refreshAll = async () => {
        await fetchParticipants();
        await onChanged();
    };

    const create = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await post('/api/admin/participants', { competitionId: competition.id, ...toPayload(form) });
            setForm({ ...emptyForm, groupId: form.groupId });
            await refreshAll();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (participant: any) => {
        setEditing(participant);
        setEditForm({
            name: participant.name || '',
            identifier: participant.identifier || '',
            age: participant.age?.toString() || '',
            country: participant.country || '',
            city: participant.city || '',
            phone: participant.phone || '',
            groupId: participant.groupId || '',
            batchNumber: participant.batchNumber?.toString() || '',
            status: participant.status,
        });
    };

    const saveEdit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editing) return;
        setBusy(true);
        setError('');
        try {
            await put('/api/admin/participants', { id: editing.id, ...toPayload(editForm) });
            setEditing(null);
            await refreshAll();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const quickStatus = async (participant: any, nextStatus: string) => {
        setError('');
        try {
            await put('/api/admin/participants', { id: participant.id, status: nextStatus });
            await refreshAll();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const remove = async (participant: any) => {
        if (!window.confirm(`Delete ${participant.name} and all judge scores?`)) return;
        setError('');
        try {
            await del(`/api/admin/participants?id=${participant.id}`);
            await refreshAll();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const pendingCount = participants.filter((participant) => participant.status === 'PENDING').length;

    return (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={create} className="glass-card p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Add participant</h2>
                        <p className="text-turquoise-500 text-xs mt-1">Admin-added participants are approved immediately.</p>
                    </div>
                    {pendingCount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/25">
                            {pendingCount} pending registration{pendingCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    <div className="xl:col-span-2">
                        <label className="admin-label">Full name *</label>
                        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" required />
                    </div>
                    <div>
                        <label className="admin-label">Identifier</label>
                        <input value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} className="admin-input" placeholder="Seat / ID" />
                    </div>
                    <div>
                        <label className="admin-label">Age</label>
                        <input type="number" min={3} max={120} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Group</label>
                        <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })} className="admin-input">
                            <option value="">Unassigned</option>
                            {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="admin-label">Country</label>
                        <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">City</label>
                        <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Phone</label>
                        <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Batch</label>
                        <input type="number" min={1} value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Status</label>
                        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="admin-input">
                            <option value="APPROVED">Approved</option>
                            <option value="PENDING">Pending</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
                <button type="submit" disabled={busy} className="btn-gold mt-5 px-5 py-2.5 text-sm flex items-center gap-2">
                    {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Add participant
                </button>
            </form>

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

            <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="flex gap-3">
                    <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="admin-input w-56">
                        <option value="">All groups</option>
                        {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="admin-input w-44">
                        <option value="">All statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
                <p className="text-xs text-turquoise-500 font-bold uppercase tracking-widest">{participants.length} participant{participants.length === 1 ? '' : 's'}</p>
            </div>

            {loading ? (
                <div className="glass-card p-12 flex justify-center"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
            ) : participants.length === 0 ? (
                <div className="glass-card p-12 text-center text-turquoise-600">No participants match these filters.</div>
            ) : (
                <div className="space-y-3">
                    {participants.map((participant) => (
                        <div key={participant.id} className="glass-card p-4 md:p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-white font-black text-lg">{participant.name}</h3>
                                        {participant.identifier && <span className="text-xs text-turquoise-500">#{participant.identifier}</span>}
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                                            participant.status === 'APPROVED'
                                                ? 'bg-emerald-500/10 text-emerald-300'
                                                : participant.status === 'PENDING'
                                                  ? 'bg-gold-500/10 text-gold-300'
                                                  : 'bg-red-500/10 text-red-300'
                                        }`}>{participant.status}</span>
                                        {participant.source === 'PUBLIC_FORM' && <span className="text-[9px] text-turquoise-500 uppercase tracking-widest">Public form</span>}
                                    </div>
                                    <p className="text-xs text-turquoise-400/70 mt-1">
                                        {participant.group?.name || 'Unassigned'} · Code {participant.registrationCode}
                                        {participant.age ? ` · ${participant.age} yrs` : ''}
                                        {participant.city || participant.country ? ` · ${[participant.city, participant.country].filter(Boolean).join(', ')}` : ''}
                                        {participant.phone ? ` · ${participant.phone}` : ''}
                                    </p>
                                    {participant.judgeScores?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {participant.judgeScores.map((score: any) => (
                                                <span key={score.id} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-turquoise-300">
                                                    {score.judge?.displayName || score.judge?.username}: <strong className="text-white">{score.points}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">{participant.average !== null ? participant.average : '—'}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-turquoise-500 font-bold">
                                            {participant.submittedCount}/{participant.judgeCount} judges
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {participant.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => quickStatus(participant, 'APPROVED')} title="Approve" className="p-2 text-emerald-300 hover:text-emerald-200"><UserCheck size={17} /></button>
                                                <button onClick={() => quickStatus(participant, 'REJECTED')} title="Reject" className="p-2 text-red-300 hover:text-red-200"><UserX size={17} /></button>
                                            </>
                                        )}
                                        {participant.status === 'REJECTED' && (
                                            <button onClick={() => quickStatus(participant, 'APPROVED')} title="Approve" className="p-2 text-emerald-300 hover:text-emerald-200"><Check size={17} /></button>
                                        )}
                                        <button onClick={() => startEdit(participant)} title="Edit" className="p-2 text-turquoise-400 hover:text-white"><Edit3 size={17} /></button>
                                        <button onClick={() => remove(participant)} title="Delete" className="p-2 text-red-400/70 hover:text-red-300"><Trash2 size={17} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 bg-turquoise-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={saveEdit} className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-white">Edit {editing.name}</h2>
                            <button type="button" onClick={() => setEditing(null)} className="text-turquoise-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="admin-label">Full name</label>
                                <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="admin-input" required />
                            </div>
                            <div>
                                <label className="admin-label">Identifier</label>
                                <input value={editForm.identifier} onChange={(event) => setEditForm({ ...editForm, identifier: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Age</label>
                                <input type="number" value={editForm.age} onChange={(event) => setEditForm({ ...editForm, age: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Country</label>
                                <input value={editForm.country} onChange={(event) => setEditForm({ ...editForm, country: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">City</label>
                                <input value={editForm.city} onChange={(event) => setEditForm({ ...editForm, city: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Phone</label>
                                <input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Group</label>
                                <select value={editForm.groupId} onChange={(event) => setEditForm({ ...editForm, groupId: event.target.value })} className="admin-input">
                                    <option value="">Unassigned</option>
                                    {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="admin-label">Batch</label>
                                <input type="number" min={1} value={editForm.batchNumber} onChange={(event) => setEditForm({ ...editForm, batchNumber: event.target.value })} className="admin-input" />
                            </div>
                            <div>
                                <label className="admin-label">Status</label>
                                <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })} className="admin-input">
                                    <option value="APPROVED">Approved</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="submit" disabled={busy} className="btn-gold flex-1 py-2.5 text-sm flex items-center justify-center gap-2"><Save size={16} /> Save participant</button>
                            <button type="button" onClick={() => setEditing(null)} className="btn-turquoise flex-1 py-2.5 text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
