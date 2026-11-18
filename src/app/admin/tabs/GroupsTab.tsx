'use client';

import { useState } from 'react';
import { Edit3, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { del, errorMessage, post, put } from '@/lib/client-api';

export default function GroupsTab({
    competition,
    onChanged,
}: {
    competition: any;
    onChanged: () => Promise<void> | void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editing, setEditing] = useState<any>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const groups = competition.groups || [];

    const create = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        setError('');
        try {
            await post('/api/admin/groups', { competitionId: competition.id, name, description });
            setName('');
            setDescription('');
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!editing) return;
        setBusy(true);
        setError('');
        try {
            await put('/api/admin/groups', editing);
            setEditing(null);
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this group? It must be empty.')) return;
        setError('');
        try {
            await del(`/api/admin/groups?id=${id}`);
            await onChanged();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={create} className="glass-card p-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Create group</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="admin-label">Name</label>
                        <input value={name} onChange={(event) => setName(event.target.value)} className="admin-input" placeholder="Category / age group" required />
                    </div>
                    <div>
                        <label className="admin-label">Description</label>
                        <input value={description} onChange={(event) => setDescription(event.target.value)} className="admin-input" placeholder="Optional" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={busy} className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2">
                            {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Add group
                        </button>
                    </div>
                </div>
            </form>

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups.length === 0 && (
                    <div className="glass-card p-12 text-center text-turquoise-600 md:col-span-2 lg:col-span-3">No groups yet.</div>
                )}
                {groups.map((group: any) => (
                    <div key={group.id} className="glass-card p-5 flex flex-col">
                        {editing?.id === group.id ? (
                            <div className="space-y-3">
                                <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="admin-input" />
                                <input value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} className="admin-input" />
                                <div className="flex gap-2">
                                    <button onClick={save} disabled={busy} className="btn-gold flex-1 py-2 text-xs flex items-center justify-center gap-1.5"><Save size={14} /> Save</button>
                                    <button onClick={() => setEditing(null)} className="btn-turquoise flex-1 py-2 text-xs flex items-center justify-center gap-1.5"><X size={14} /> Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-gold-400">{group.name}</h3>
                                        <p className="text-sm text-turquoise-400/70 mt-1">{group.description || 'No description'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setEditing({ id: group.id, name: group.name, description: group.description || '' })} className="text-turquoise-500 hover:text-white p-1.5"><Edit3 size={15} /></button>
                                        <button onClick={() => remove(group.id)} className="text-red-400/70 hover:text-red-300 p-1.5"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-white/10 flex justify-between text-[10px] uppercase tracking-widest text-turquoise-500 font-bold">
                                    <span>{group._count?.participants ?? 0} participants</span>
                                    <span>{group._count?.questions ?? 0} questions</span>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
