'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Layers, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { del, errorMessage, post, put } from '@/lib/client-api';

type Surah = { surahName: string; surahNameArabic: string; totalAyah: number };

const emptyForm = {
    number: 1,
    surah: '',
    surahArabic: '',
    surahNumber: 1,
    startAyah: 1,
    endAyah: 7,
    difficulty: 'medium',
};

export default function QuestionsTab({ competition }: { competition: any }) {
    const groups = useMemo(() => competition.groups || [], [competition.groups]);
    const [groupId, setGroupId] = useState(groups[0]?.id || '');
    const [questions, setQuestions] = useState<any[]>([]);
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [surahLoading, setSurahLoading] = useState(true);
    const [form, setForm] = useState({ ...emptyForm });
    const [editing, setEditing] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!groupId && groups[0]?.id) setGroupId(groups[0].id);
    }, [groupId, groups]);

    useEffect(() => {
        fetch('https://quranapi.pages.dev/api/surah.json')
            .then((res) => (res.ok ? res.json() : []))
            .then((data: Surah[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setSurahs(data);
                    const first = data[0];
                    setForm((prev) => ({
                        ...prev,
                        surahNumber: 1,
                        surah: first.surahName,
                        surahArabic: first.surahNameArabic,
                        startAyah: 1,
                        endAyah: first.totalAyah,
                    }));
                }
            })
            .catch(() => undefined)
            .finally(() => setSurahLoading(false));
    }, []);

    const fetchQuestions = useCallback(async () => {
        if (!groupId) {
            setQuestions([]);
            return;
        }
        setLoading(true);
        try {
            const data = await fetch(`/api/admin/questions?competitionId=${competition.id}&groupId=${groupId}`, {
                credentials: 'same-origin',
            }).then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load questions');
                return payload as any[];
            });
            setQuestions(data);
            setError('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [competition.id, groupId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const maxAyah = useMemo(() => {
        if (surahs.length === 0) return 286;
        return surahs[form.surahNumber - 1]?.totalAyah || 286;
    }, [surahs, form.surahNumber]);

    const selectSurah = (surahNumber: number) => {
        if (surahs.length === 0) {
            setForm((prev) => ({ ...prev, surahNumber }));
            return;
        }
        const surah = surahs[surahNumber - 1];
        setForm((prev) => ({
            ...prev,
            surahNumber,
            surah: surah.surahName,
            surahArabic: surah.surahNameArabic,
            startAyah: 1,
            endAyah: surah.totalAyah,
        }));
    };

    const create = async (keepBatch: boolean) => {
        if (!groupId) {
            setError('Create a group first');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await post('/api/admin/questions', {
                competitionId: competition.id,
                groupId,
                ...form,
            });
            if (!keepBatch) {
                setForm((prev) => ({
                    ...emptyForm,
                    number: prev.number + 1,
                    surah: prev.surah,
                    surahArabic: prev.surahArabic,
                    surahNumber: prev.surahNumber,
                    startAyah: prev.startAyah,
                    endAyah: prev.endAyah,
                }));
            }
            await fetchQuestions();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const saveEdit = async () => {
        if (!editing) return;
        setBusy(true);
        setError('');
        try {
            await put('/api/admin/questions', { ...editing, groupId: editing.groupId || groupId });
            setEditing(null);
            await fetchQuestions();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this question?')) return;
        setError('');
        try {
            await del(`/api/admin/questions?id=${id}`);
            await fetchQuestions();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const batches = useMemo(() => {
        const map = new Map<number, any[]>();
        for (const question of questions) {
            if (!map.has(question.number)) map.set(question.number, []);
            map.get(question.number)!.push(question);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [questions]);

    const manualSurah = surahs.length === 0 && !surahLoading;

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="glass-card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Questions & batches</h2>
                        <p className="text-turquoise-500 text-xs mt-1">Questions sharing a batch number are shown together to judges.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest">Group</span>
                        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="admin-input w-56">
                            {groups.length === 0 && <option value="">No groups</option>}
                            {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="admin-label">Batch number</label>
                            <input type="number" min={1} value={form.number} onChange={(event) => setForm({ ...form, number: Number(event.target.value) })} className="admin-input" />
                        </div>
                        <div>
                            <label className="admin-label">Difficulty</label>
                            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="admin-input">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="admin-label">Surah</label>
                            {surahLoading ? (
                                <div className="flex items-center gap-2 text-turquoise-500 text-sm py-3"><Loader2 size={15} className="animate-spin" /> Loading surah list…</div>
                            ) : manualSurah ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input value={form.surah} onChange={(event) => setForm({ ...form, surah: event.target.value })} className="admin-input" placeholder="Surah name (English)" />
                                    <input value={form.surahArabic} onChange={(event) => setForm({ ...form, surahArabic: event.target.value })} className="admin-input font-arabic" placeholder="اسم السورة" />
                                    <input type="number" min={1} max={114} value={form.surahNumber} onChange={(event) => setForm({ ...form, surahNumber: Number(event.target.value) })} className="admin-input" placeholder="Surah number" />
                                </div>
                            ) : (
                                <select value={form.surahNumber} onChange={(event) => selectSurah(Number(event.target.value))} className="admin-input">
                                    {surahs.map((surah, index) => (
                                        <option key={index} value={index + 1}>{index + 1}. {surah.surahName} — {surah.surahNameArabic}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="admin-label">Start ayah</label>
                            <input type="number" min={1} max={maxAyah} value={form.startAyah} onChange={(event) => setForm({ ...form, startAyah: Number(event.target.value) })} className="admin-input" />
                        </div>
                        <div>
                            <label className="admin-label">End ayah</label>
                            <input type="number" min={form.startAyah} max={maxAyah} value={form.endAyah} onChange={(event) => setForm({ ...form, endAyah: Number(event.target.value) })} className="admin-input" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gold-500/5 border border-gold-500/20 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-gold-400 font-bold text-sm mb-3"><Layers size={17} /> Batch #{form.number}</div>
                            <p className="text-turquoise-400 text-xs leading-relaxed">Use “Add to batch” to append another question to batch #{form.number}, or “Add & next” to save and advance.</p>
                        </div>
                        <div className="space-y-2 mt-5">
                            <button onClick={() => create(true)} disabled={busy} className="w-full py-2.5 rounded-xl bg-turquoise-500/20 border border-turquoise-500/30 text-turquoise-200 font-bold text-sm hover:bg-turquoise-500/30 transition-all flex items-center justify-center gap-2">
                                <Plus size={15} /> Add to batch #{form.number}
                            </button>
                            <button onClick={() => create(false)} disabled={busy} className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2">
                                {busy ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Add &amp; next batch
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

            {loading ? (
                <div className="glass-card p-12 flex justify-center"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
            ) : batches.length === 0 ? (
                <div className="glass-card p-12 text-center text-turquoise-600">No questions in this group yet.</div>
            ) : (
                <div className="space-y-4">
                    {batches.map(([batchNumber, items]) => (
                        <div key={batchNumber} className="glass-card overflow-hidden">
                            <div className="px-5 py-4 bg-gold-500/5 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-11 h-11 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-lg font-black text-gold-400">#{batchNumber}</span>
                                    <div>
                                        <p className="text-white font-bold text-sm">Batch {batchNumber}</p>
                                        <p className="text-turquoise-500 text-[10px] uppercase tracking-widest">{items.length} question{items.length > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${items.some((item) => item.isUsed) ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                                    {items.some((item) => item.isUsed) ? 'Used' : 'Available'}
                                </span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {items.map((question) => (
                                    <div key={question.id} className="px-5 py-4">
                                        {editing?.id === question.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                <div className="md:col-span-1">
                                                    <label className="admin-label">Batch</label>
                                                    <input type="number" value={editing.number} onChange={(event) => setEditing({ ...editing, number: Number(event.target.value) })} className="admin-input py-2" />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="admin-label">Surah</label>
                                                    <input value={editing.surah} onChange={(event) => setEditing({ ...editing, surah: event.target.value })} className="admin-input py-2" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="admin-label">Surah #</label>
                                                    <input type="number" value={editing.surahNumber} onChange={(event) => setEditing({ ...editing, surahNumber: Number(event.target.value) })} className="admin-input py-2" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="admin-label">Ayahs</label>
                                                    <div className="flex gap-2">
                                                        <input type="number" value={editing.startAyah ?? ''} onChange={(event) => setEditing({ ...editing, startAyah: Number(event.target.value) })} className="admin-input py-2" />
                                                        <input type="number" value={editing.endAyah ?? ''} onChange={(event) => setEditing({ ...editing, endAyah: Number(event.target.value) })} className="admin-input py-2" />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="admin-label">Level</label>
                                                    <select value={editing.difficulty} onChange={(event) => setEditing({ ...editing, difficulty: event.target.value })} className="admin-input py-2">
                                                        <option value="easy">Easy</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="hard">Hard</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 flex gap-2 justify-end">
                                                    <button onClick={saveEdit} disabled={busy} className="text-gold-400 hover:text-gold-300 p-2"><Save size={17} /></button>
                                                    <button onClick={() => setEditing(null)} className="text-turquoise-400 hover:text-white p-2"><X size={17} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="text-white font-bold">{question.surah}</h3>
                                                        <span className="font-arabic text-gold-400">{question.surahArabic}</span>
                                                        <span className="text-[10px] uppercase tracking-widest text-turquoise-500 font-bold">{question.difficulty}</span>
                                                    </div>
                                                    <p className="text-xs text-turquoise-500 mt-1">Ayah {question.startAyah ?? '?'}–{question.endAyah ?? '?'}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditing({ ...question })} className="text-turquoise-500 hover:text-white p-2"><Edit3 size={16} /></button>
                                                    <button onClick={() => remove(question.id)} className="text-red-400/70 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
