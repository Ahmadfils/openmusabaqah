'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Edit3, Plus, Save, X, Loader2, Layers } from 'lucide-react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'questions' | 'participants'>('groups');
    const [groups, setGroups] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [surahList, setSurahList] = useState<any[]>([]);
    const [loadingSurahs, setLoadingSurahs] = useState(false);

    // Editing states
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [editingParticipant, setEditingParticipant] = useState<any>(null);
    const [editingSurahMaxAyah, setEditingSurahMaxAyah] = useState(0);

    // Form states - Groups
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    // Form states - Questions (batch-aware)
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [qNumber, setQNumber] = useState(1);   // batch number
    const [qSurahEn, setQSurahEn] = useState('');
    const [qSurahAr, setQSurahAr] = useState('');
    const [qSurahNum, setQSurahNum] = useState(1);
    const [qStartAyah, setQStartAyah] = useState<number>(1);
    const [qEndAyah, setQEndAyah] = useState<number>(1);
    const [qMaxAyah, setQMaxAyah] = useState(7);
    const [qDiff, setQDiff] = useState('medium');
    // Track whether the next question should stay in the same batch
    const [addingToBatch, setAddingToBatch] = useState(false);
    const [lastSavedBatch, setLastSavedBatch] = useState<number | null>(null);

    // Form states - Participants
    const [pName, setPName] = useState('');
    const [pIdentifier, setPIdentifier] = useState('');
    const [pGroupId, setPGroupId] = useState('');

    useEffect(() => {
        fetchInitialData();
        fetchSurahList();
    }, []);

    const fetchInitialData = async () => {
        await fetchGroups();
        setLoading(false);
    };

    const fetchSurahList = async () => {
        setLoadingSurahs(true);
        try {
            const res = await fetch('https://quranapi.pages.dev/api/surah.json');
            if (res.ok) {
                const data = await res.json();
                setSurahList(data);
                if (data.length > 0 && !qSurahEn) {
                    const first = data[0];
                    setQSurahNum(1);
                    setQSurahEn(first.surahName);
                    setQSurahAr(first.surahNameArabic);
                    setQMaxAyah(first.totalAyah);
                    setQStartAyah(1);
                    setQEndAyah(first.totalAyah);
                }
            }
        } catch (e) {
            console.error('Failed to fetch surah list', e);
        }
        setLoadingSurahs(false);
    };

    const fetchGroups = async () => {
        const res = await fetch('/api/admin/groups');
        if (res.ok) {
            const data = await res.json();
            setGroups(data);
            if (data.length > 0) {
                if (!selectedGroupId) setSelectedGroupId(data[0].id);
                if (!pGroupId) setPGroupId(data[0].id);
            }
        }
    };

    const fetchQuestions = async (groupId: string) => {
        if (!groupId) return;
        const res = await fetch(`/api/admin/questions?groupId=${groupId}`);
        if (res.ok) setQuestions(await res.json());
    };

    const fetchParticipants = async () => {
        const res = await fetch('/api/admin/participants');
        if (res.ok) setParticipants(await res.json());
    };

    useEffect(() => {
        if (activeTab === 'questions' && selectedGroupId) {
            fetchQuestions(selectedGroupId);
        } else if (activeTab === 'participants') {
            fetchParticipants();
        }
    }, [activeTab, selectedGroupId]);

    const onSurahChange = (surahIndex: number) => {
        const s = surahList[surahIndex];
        setQSurahNum(surahIndex + 1);
        setQSurahEn(s.surahName);
        setQSurahAr(s.surahNameArabic);
        setQMaxAyah(s.totalAyah);
        setQStartAyah(1);
        setQEndAyah(s.totalAyah);
    };

    const onEditingSurahChange = (surahIndex: number) => {
        const s = surahList[surahIndex];
        setEditingQuestion({
            ...editingQuestion,
            surahNumber: surahIndex + 1,
            surah: s.surahName,
            surahArabic: s.surahNameArabic,
            startAyah: 1,
            endAyah: s.totalAyah
        });
        setEditingSurahMaxAyah(s.totalAyah);
    };

    // --- GROUPS ---
    const createGroup = async () => {
        if (!newGroupName.trim()) return;
        const res = await fetch('/api/admin/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
        });
        if (res.ok) { setNewGroupName(''); setNewGroupDesc(''); fetchGroups(); }
        else { const err = await res.json(); alert(`Error: ${err.error}`); }
    };

    const updateGroup = async () => {
        if (!editingGroup.name.trim()) return;
        const res = await fetch('/api/admin/groups', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingGroup),
        });
        if (res.ok) { setEditingGroup(null); fetchGroups(); }
        else { const err = await res.json(); alert(`Error: ${err.error}`); }
    };

    const deleteGroup = async (id: string) => {
        if (!confirm('Delete this group? (must be empty)')) return;
        const res = await fetch(`/api/admin/groups?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchGroups();
        else { const err = await res.json(); alert(err.error); }
    };

    // --- QUESTIONS (BATCH) ---
    const createQuestion = async (keepBatch = false) => {
        if (!qSurahEn || !selectedGroupId) {
            alert('Please select a group and a Surah');
            return;
        }
        const res = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                number: qNumber,
                surah: qSurahEn,
                surahArabic: qSurahAr,
                surahNumber: qSurahNum,
                startAyah: Number(qStartAyah),
                endAyah: Number(qEndAyah),
                difficulty: qDiff,
                groupId: selectedGroupId,
            }),
        });
        if (res.ok) {
            setLastSavedBatch(qNumber);
            if (!keepBatch) {
                setQNumber(qNumber + 1);
                setAddingToBatch(false);
            } else {
                setAddingToBatch(true);
            }
            // Reset surah to first
            if (surahList.length > 0) {
                const first = surahList[0];
                setQSurahNum(1); setQSurahEn(first.surahName); setQSurahAr(first.surahNameArabic);
                setQMaxAyah(first.totalAyah); setQStartAyah(1); setQEndAyah(first.totalAyah);
            }
            fetchQuestions(selectedGroupId);
        } else {
            const err = await res.json();
            alert(`Failed: ${err.error || 'Unknown error'}`);
        }
    };

    const updateQuestion = async () => {
        const res = await fetch('/api/admin/questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...editingQuestion,
                startAyah: Number(editingQuestion.startAyah),
                endAyah: Number(editingQuestion.endAyah)
            }),
        });
        if (res.ok) { setEditingQuestion(null); fetchQuestions(selectedGroupId); }
        else { const err = await res.json(); alert(`Error: ${err.error}`); }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm('Delete this question?')) return;
        const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchQuestions(selectedGroupId);
    };

    // --- PARTICIPANTS ---
    const createParticipant = async () => {
        if (!pName || !pGroupId) { alert('Please enter a Name and select a Group'); return; }
        const res = await fetch('/api/admin/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: pName, identifier: pIdentifier, groupId: pGroupId }),
        });
        if (res.ok) { setPName(''); setPIdentifier(''); fetchParticipants(); }
        else { const err = await res.json(); alert(`Error: ${err.error}`); }
    };

    const updateParticipant = async () => {
        const res = await fetch('/api/admin/participants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingParticipant),
        });
        if (res.ok) { setEditingParticipant(null); fetchParticipants(); }
        else { const err = await res.json(); alert(`Error: ${err.error}`); }
    };

    const deleteParticipant = async (id: string) => {
        if (!confirm('Delete this participant?')) return;
        const res = await fetch(`/api/admin/participants?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchParticipants();
    };

    // --- Group questions by batch number ---
    const questionsBatch = questions.reduce((acc: Record<number, any[]>, q) => {
        if (!acc[q.number]) acc[q.number] = [];
        acc[q.number].push(q);
        return acc;
    }, {});

    if (loading) return <div className="min-h-screen flex items-center justify-center text-turquoise-400">Loading Admin...</div>;

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1"><span className="gold-text">Admin</span> Portal</h1>
                        <p className="font-arabic text-turquoise-400/70 text-lg">لوحة الإدارة</p>
                    </div>
                    <Link href="/" className="btn-turquoise px-4 py-2 text-sm">Return Home</Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {(['groups', 'participants', 'questions'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gold-500 text-gray-900 font-bold shadow-lg shadow-gold-500/20' : 'glass-card text-turquoise-300'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    {/* GROUPS TAB */}
                    {activeTab === 'groups' && (
                        <div className="animate-slide-up">
                            <div className="glass-card p-8 mb-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="admin-input" />
                                    <input type="text" placeholder="Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} className="admin-input" />
                                    <button onClick={createGroup} className="btn-gold flex items-center justify-center gap-2"><Plus size={18} /> Create Group</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map((group) => (
                                    <div key={group.id} className="glass-card p-6 border-turquoise-500/10 hover:border-turquoise-500/30 transition-all flex flex-col">
                                        {editingGroup?.id === group.id ? (
                                            <div className="space-y-4 flex-1">
                                                <input type="text" value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="admin-input w-full" />
                                                <input type="text" value={editingGroup.description} onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })} className="admin-input w-full" />
                                                <div className="flex gap-2">
                                                    <button onClick={updateGroup} className="btn-gold flex-1 py-1 text-sm">Save</button>
                                                    <button onClick={() => setEditingGroup(null)} className="btn-turquoise flex-1 py-1 text-sm">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-xl font-bold text-gold-400">{group.name}</h3>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setEditingGroup(group)} className="text-turquoise-500 hover:text-white p-1"><Edit3 size={16} /></button>
                                                            <button onClick={() => deleteGroup(group.id)} className="text-red-500/70 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                    <p className="text-turquoise-300/70 text-sm mb-4">{group.description}</p>
                                                </div>
                                                <div className="flex justify-between text-xs text-turquoise-500 pt-4 border-t border-white/5">
                                                    <span>{group._count?.participants} Participants</span>
                                                    <span>{group._count?.questions} Questions</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PARTICIPANTS TAB */}
                    {activeTab === 'participants' && (
                        <div className="animate-slide-up">
                            <div className="glass-card p-8 mb-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Add New Participant</h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="admin-label">Full Name</label>
                                        <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} className="admin-input w-full" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Identifier (e.g. ID#)</label>
                                        <input type="text" value={pIdentifier} onChange={(e) => setPIdentifier(e.target.value)} className="admin-input w-full" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Group</label>
                                        <select value={pGroupId} onChange={(e) => setPGroupId(e.target.value)} className="admin-input w-full">
                                            {groups.map(g => <option key={g.id} value={g.id} className="bg-turquoise-950">{g.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={createParticipant} className="btn-gold flex items-center justify-center gap-2 py-2.5"><Plus size={18} /> Add</button>
                                </div>
                            </div>
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-turquoise-400 text-xs font-bold uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-turquoise-400 text-xs font-bold uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-turquoise-400 text-xs font-bold uppercase tracking-wider">Group</th>
                                            <th className="px-6 py-4 text-turquoise-400 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {participants.map((p) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    {editingParticipant?.id === p.id
                                                        ? <input type="text" value={editingParticipant.name} onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })} className="admin-input py-1 w-full" />
                                                        : <span className="text-white font-medium">{p.name}</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingParticipant?.id === p.id
                                                        ? <input type="text" value={editingParticipant.identifier || ''} onChange={(e) => setEditingParticipant({ ...editingParticipant, identifier: e.target.value })} className="admin-input py-1 w-full" />
                                                        : <span className="text-turquoise-300/70">{p.identifier || '-'}</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingParticipant?.id === p.id
                                                        ? <select value={editingParticipant.groupId} onChange={(e) => setEditingParticipant({ ...editingParticipant, groupId: e.target.value })} className="admin-input py-1 w-full">
                                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                        </select>
                                                        : <span className="bg-turquoise-500/10 text-turquoise-400 px-3 py-1 rounded-full text-xs">{p.group?.name}</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {editingParticipant?.id === p.id
                                                        ? <div className="flex justify-end gap-2">
                                                            <button onClick={updateParticipant} className="text-gold-500 hover:text-gold-400"><Save size={18} /></button>
                                                            <button onClick={() => setEditingParticipant(null)} className="text-turquoise-500 hover:text-white"><X size={18} /></button>
                                                        </div>
                                                        : <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingParticipant(p)} className="text-turquoise-500 hover:text-white"><Edit3 size={18} /></button>
                                                            <button onClick={() => deleteParticipant(p.id)} className="text-red-500/70 hover:text-red-400"><Trash2 size={18} /></button>
                                                        </div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {participants.length === 0 && <div className="p-10 text-center text-turquoise-700 italic">No participants found.</div>}
                            </div>
                        </div>
                    )}

                    {/* QUESTIONS TAB */}
                    {activeTab === 'questions' && (
                        <div className="animate-slide-up">
                            {/* Add Question Form */}
                            <div className="glass-card p-8 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {addingToBatch
                                                ? <><span className="text-gold-400">+ Adding to Batch #{lastSavedBatch}</span></>
                                                : 'Add New Question / Batch'}
                                        </h2>
                                        <p className="text-turquoise-500 text-xs mt-1">Multiple questions can share the same Batch Number — they will all appear to the judge together.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs text-turquoise-400 font-bold uppercase tracking-wider">Group:</label>
                                        <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="admin-input">
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="admin-label">Batch Number</label>
                                                <input type="number" value={qNumber} onChange={(e) => setQNumber(Number(e.target.value))} className="admin-input w-full" min={1} />
                                            </div>
                                            <div>
                                                <label className="admin-label">Difficulty</label>
                                                <select value={qDiff} onChange={(e) => setQDiff(e.target.value)} className="admin-input w-full">
                                                    <option value="easy">Easy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="hard">Hard</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="admin-label">Select Surah</label>
                                            {loadingSurahs ? (
                                                <div className="flex items-center gap-2 text-turquoise-500 text-sm py-2">
                                                    <Loader2 size={16} className="animate-spin" /> Loading Surahs...
                                                </div>
                                            ) : (
                                                <select
                                                    value={qSurahNum - 1}
                                                    onChange={(e) => onSurahChange(Number(e.target.value))}
                                                    className="admin-input w-full"
                                                >
                                                    {surahList.map((s, idx) => (
                                                        <option key={idx} value={idx} className="bg-turquoise-950">
                                                            {idx + 1}. {s.surahName} ({s.surahNameArabic})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="admin-label">Start Ayah (1–{qMaxAyah})</label>
                                                <select value={qStartAyah} onChange={(e) => setQStartAyah(Number(e.target.value))} className="admin-input w-full">
                                                    {Array.from({ length: qMaxAyah }, (_, i) => (
                                                        <option key={i + 1} value={i + 1} className="bg-turquoise-950">{i + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="admin-label">End Ayah ({qStartAyah}–{qMaxAyah})</label>
                                                <select value={qEndAyah} onChange={(e) => setQEndAyah(Number(e.target.value))} className="admin-input w-full">
                                                    {Array.from({ length: qMaxAyah - qStartAyah + 1 }, (_, i) => (
                                                        <option key={i + qStartAyah} value={i + qStartAyah} className="bg-turquoise-950">{i + qStartAyah}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col justify-end gap-4">
                                        <div className="p-6 rounded-2xl bg-gold-500/5 border border-gold-500/20">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Layers size={20} className="text-gold-400" />
                                                <p className="text-gold-400 font-bold text-sm">Batch #{qNumber}</p>
                                            </div>
                                            <p className="text-turquoise-400 text-xs mb-6 leading-relaxed">
                                                Use <strong className="text-white">"Add to Batch"</strong> to add another surah/ayah selection under <strong className="text-white">the same batch number #{qNumber}</strong>. The judge will see all questions of the batch at once.
                                                <br /><br />
                                                Use <strong className="text-white">"Add & Next Batch"</strong> to save and automatically advance to batch #{qNumber + 1}.
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={() => createQuestion(true)} className="w-full py-3 rounded-xl bg-turquoise-500/20 border border-turquoise-500/30 text-turquoise-300 font-bold text-sm hover:bg-turquoise-500/30 transition-all flex items-center justify-center gap-2">
                                                    <Plus size={16} /> Add to Batch #{qNumber}
                                                </button>
                                                <button onClick={() => createQuestion(false)} className="btn-gold py-3 flex items-center justify-center gap-2">
                                                    <Plus size={16} /> Add &amp; Next Batch →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Questions List — Grouped by Batch */}
                            <div className="space-y-6">
                                {Object.keys(questionsBatch).length === 0 && (
                                    <div className="p-12 text-center text-turquoise-700 italic glass-card">No questions added yet for this group.</div>
                                )}
                                {Object.entries(questionsBatch).sort(([a], [b]) => Number(a) - Number(b)).map(([batchNum, batchQuestions]) => (
                                    <div key={batchNum} className="glass-card border-white/5 overflow-hidden">
                                        {/* Batch Header */}
                                        <div className="flex items-center gap-4 p-5 border-b border-white/5 bg-gold-500/5">
                                            <div className="flex items-center justify-center bg-gold-500/20 rounded-xl w-14 h-14 border border-gold-500/30 flex-none">
                                                <span className="text-2xl font-black text-gold-400">#{batchNum}</span>
                                            </div>
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-tight">Batch {batchNum}</p>
                                                <p className="text-turquoise-500 text-xs font-bold">{batchQuestions.length} question{batchQuestions.length > 1 ? 's' : ''} in this batch</p>
                                            </div>
                                        </div>

                                        {/* Sub-questions */}
                                        <div className="divide-y divide-white/5">
                                            {batchQuestions.map((q: any, idx: number) => (
                                                <div key={q.id} className="p-5">
                                                    {editingQuestion?.id === q.id ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div>
                                                                        <label className="admin-label">Batch #</label>
                                                                        <input type="number" value={editingQuestion.number} onChange={(e) => setEditingQuestion({ ...editingQuestion, number: Number(e.target.value) })} className="admin-input py-1 w-full" />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="admin-label">Surah</label>
                                                                        <select value={editingQuestion.surahNumber - 1} onChange={(e) => onEditingSurahChange(Number(e.target.value))} className="admin-input py-1 w-full">
                                                                            {surahList.map((s, i) => <option key={i} value={i}>{i + 1}. {s.surahName}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <select value={editingQuestion.startAyah} onChange={(e) => setEditingQuestion({ ...editingQuestion, startAyah: Number(e.target.value) })} className="admin-input py-1">
                                                                        {Array.from({ length: editingSurahMaxAyah || 286 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                                                    </select>
                                                                    <select value={editingQuestion.endAyah} onChange={(e) => setEditingQuestion({ ...editingQuestion, endAyah: Number(e.target.value) })} className="admin-input py-1">
                                                                        {Array.from({ length: (editingSurahMaxAyah || 286) - editingQuestion.startAyah + 1 }, (_, i) => <option key={i + editingQuestion.startAyah} value={i + editingQuestion.startAyah}>{i + editingQuestion.startAyah}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={updateQuestion} className="btn-gold flex-1 py-1 text-sm">Save Changes</button>
                                                                    <button onClick={() => setEditingQuestion(null)} className="btn-turquoise flex-1 py-1 text-sm">Cancel</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-turquoise-600 font-mono text-xs w-6 text-center flex-none">{idx + 1}</div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h3 className="text-base font-bold text-white">{q.surah}</h3>
                                                                    <span className="font-arabic text-turquoise-400">{q.surahArabic}</span>
                                                                </div>
                                                                <p className="text-xs text-turquoise-500 font-bold uppercase tracking-widest">
                                                                    Ayah {q.startAyah || '?'}–{q.endAyah || '?'} • {q.difficulty}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2 flex-none">
                                                                <button onClick={() => {
                                                                    setEditingQuestion(q);
                                                                    const s = surahList.find(s => s.surahName === q.surah);
                                                                    if (s) setEditingSurahMaxAyah(s.totalAyah);
                                                                }} className="text-turquoise-500 hover:text-white p-2"><Edit3 size={16} /></button>
                                                                <button onClick={() => deleteQuestion(q.id)} className="text-red-500/70 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .admin-input {
                    @apply bg-turquoise-900/20 border border-turquoise-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/60 transition-all placeholder:text-turquoise-800;
                    background-color: #064e3b;
                }
                .admin-input:focus {
                    background-color: #065f46;
                    box-shadow: 0 0 0 2px rgba(245,158,11,0.1);
                }
                .admin-input:-webkit-autofill,
                .admin-input:-webkit-autofill:hover,
                .admin-input:-webkit-autofill:focus {
                    -webkit-text-fill-color: white;
                    -webkit-box-shadow: 0 0 0px 1000px #064e3b inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
                .admin-label {
                    @apply text-turquoise-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block;
                }
                select.admin-input {
                    @apply appearance-none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f59e0b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1.2rem;
                    padding-right: 2.5rem;
                }
            `}</style>
        </main>
    );
}
