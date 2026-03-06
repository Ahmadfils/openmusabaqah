'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Users, BookOpen, ChevronRight, Save, RotateCcw, Play, Pause, Volume2, Loader2, Layers, FileText } from 'lucide-react';

export default function JudgePage() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]); // [{ batchNumber, questions, isUsed }]
    const [systemState, setSystemState] = useState<any>(null);
    const [nextParticipantId, setNextParticipantId] = useState('');

    // Active judging session
    const [activeBatch, setActiveBatch] = useState<any>(null); // { batchNumber, questions: [] }
    const [activeParticipant, setActiveParticipant] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [points, setPoints] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);

    // Quran content for each question in the active batch
    const [surahDataMap, setSurahDataMap] = useState<Record<number, any>>({}); // surahNumber -> data
    const [loadingQuran, setLoadingQuran] = useState(false);

    // Audio (plays for first question's surah)
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        try {
            const res = await fetch('/api/admin/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
                if (data.length > 0) setSelectedGroupId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupData = useCallback(async (groupId: string) => {
        if (!groupId) return;
        try {
            const [pRes, sRes, stateRes] = await Promise.all([
                fetch(`/api/admin/participants?groupId=${groupId}`).catch(() => null),
                fetch(`/api/judge/selections?groupId=${groupId}`).catch(() => null),
                fetch('/api/state').catch(() => null),
            ]);
            if (pRes?.ok) setParticipants(await pRes.json());
            if (sRes?.ok) setBatches(await sRes.json());
            if (stateRes?.ok) setSystemState(await stateRes.json());
        } catch (error) {
            // Silently ignore polling errors
        }
    }, []);

    useEffect(() => {
        if (selectedGroupId) {
            fetchGroupData(selectedGroupId);
            const interval = setInterval(() => fetchGroupData(selectedGroupId), 4000);
            return () => clearInterval(interval);
        }
    }, [selectedGroupId, fetchGroupData]);

    const fetchSurahDetail = async (surahNum: number): Promise<any> => {
        if (surahDataMap[surahNum]) return surahDataMap[surahNum];
        try {
            const res = await fetch(`https://quranapi.pages.dev/api/${surahNum}.json`);
            if (res.ok) {
                const data = await res.json();
                setSurahDataMap(prev => ({ ...prev, [surahNum]: data }));
                return data;
            }
        } catch (e) { console.error('Quran fetch error', e); }
        return null;
    };

    const setNextUp = async () => {
        const res = await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: nextParticipantId || null,
                currentBatchNumber: null,
            }),
        });
        if (res.ok) setSystemState(await res.json());
    };

    const startJudging = async (batch: any) => {
        setActiveBatch(batch);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        // Fetch existing score if any
        if (systemState?.currentParticipantId) {
            const participant = participants.find(p => p.id === systemState.currentParticipantId);
            setActiveParticipant(participant || null);
            if (participant?.score) {
                setNotes(participant.score.notes || '');
                setPoints(participant.score.points ?? '');
            } else {
                setNotes('');
                setPoints('');
            }
        } else {
            setNotes('');
            setPoints('');
        }

        // Load Quran text for each question in the batch
        setLoadingQuran(true);
        for (const q of batch.questions) {
            if (q.surahNumber) await fetchSurahDetail(q.surahNumber);
        }
        setLoadingQuran(false);

        // Update system state to show this participant is active
        await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: systemState?.currentParticipantId || null,
                currentBatchNumber: batch.batchNumber,
            }),
        });
    };

    const saveNotes = async () => {
        if (!activeBatch || !systemState?.currentParticipantId) return;
        setSaving(true);

        const res = await fetch('/api/judge/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: systemState.currentParticipantId,
                notes,
                points: points === '' ? null : Number(points),
                currentBatchNumber: activeBatch.batchNumber,
                groupId: selectedGroupId,
            }),
        });
        if (res.ok) {
            setActiveBatch(null);
            setActiveParticipant(null);
            setNotes('');
            setPoints('');
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            // Reset current participant in state
            await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentGroupId: selectedGroupId,
                    currentParticipantId: null,
                    currentBatchNumber: activeBatch?.batchNumber, // keep batch visible on participant screen
                }),
            });
            fetchGroupData(selectedGroupId);
        }
        setSaving(false);
    };

    const getVerseRangeText = (q: any) => {
        const surahData = surahDataMap[q.surahNumber];
        if (!surahData) return [];
        const start = Number(q.startAyah) || 1;
        const end = Number(q.endAyah) || surahData.totalAyah;
        return (surahData.arabic1 || []).slice(start - 1, end).map((text: string, idx: number) => ({
            number: start + idx,
            text,
        }));
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        isPlaying ? audioRef.current.pause() : audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const currentParticipant = participants.find(p => p.id === systemState?.currentParticipantId);

    // The batch the participant chose (from system state)
    const currentStateBatch = systemState?.currentBatchNumber;
    const selectedByParticipant = batches.find(b => b.batchNumber === currentStateBatch);

    // Auto-load the batch when participant selects it
    useEffect(() => {
        if (currentStateBatch && selectedByParticipant && activeBatch?.batchNumber !== currentStateBatch) {
            startJudging(selectedByParticipant);
        }
    }, [currentStateBatch, selectedByParticipant, activeBatch]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-turquoise-400">Initializing Judge Portal...</div>;

    // Audio URL: use first question's surah
    const firstQ = activeBatch?.questions?.[0];
    const audioUrl = firstQ ? surahDataMap[firstQ.surahNumber]?.audio?.['1']?.url : undefined;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20">
            <div className="max-w-7xl mx-auto">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8 glass-card px-6 py-4">
                    <div className="flex items-center gap-6">
                        <NextLink href="/" className="gold-text font-bold hover:scale-105 transition-all flex items-center gap-2">
                            <BookOpen size={16} /> OpenMusabaqah
                        </NextLink>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-turquoise-500 text-xs font-bold uppercase tracking-widest">Group:</span>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="bg-transparent text-white font-bold px-4 py-1 focus:outline-none border-b border-gold-500/30 cursor-pointer"
                            >
                                {groups.map(g => <option key={g.id} value={g.id} className="bg-turquoise-900">{g.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <NextLink href="/admin" className="text-xs text-turquoise-400 hover:text-white uppercase tracking-tighter">Admin Settings</NextLink>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Participant Turn Control */}
                        <div className="glass-card p-6">
                            <h2 className="flex items-center gap-2 text-white font-bold mb-6">
                                <Users size={18} className="text-gold-400" /> Turn Control
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-1.5 block">Active Participant</label>
                                    <select
                                        value={nextParticipantId}
                                        onChange={(e) => setNextParticipantId(e.target.value)}
                                        className="w-full bg-turquoise-900/40 border border-turquoise-700/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500/50"
                                    >
                                        <option value="">-- Select Participant --</option>
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id} className="bg-turquoise-900">
                                                {p.name} {p.identifier ? `(${p.identifier})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={setNextUp} className="w-full btn-gold py-2 text-sm flex items-center justify-center gap-2">
                                    <ChevronRight size={16} /> Set Active
                                </button>

                                {currentParticipant && (
                                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                                        <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Currently Live:</p>
                                        <p className="text-white font-bold text-sm">{currentParticipant.name}</p>
                                        {currentStateBatch && (
                                            <p className="text-gold-400 text-xs font-bold mt-1">Chose Batch #{currentStateBatch}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Batch List */}
                        <div className="glass-card p-6">
                            <h2 className="flex items-center gap-2 text-white font-bold mb-4">
                                <RotateCcw size={18} className="text-gold-400" /> Batches
                            </h2>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {batches.length === 0 ? (
                                    <p className="text-turquoise-800 italic text-sm">No batches configured...</p>
                                ) : (
                                    batches.sort((a, b) => a.batchNumber - b.batchNumber).map(batch => (
                                        <button
                                            key={batch.batchNumber}
                                            onClick={() => startJudging(batch)}
                                            className={`w-full p-3 rounded-xl border text-left transition-all group ${activeBatch?.batchNumber === batch.batchNumber
                                                ? 'border-gold-500 bg-gold-500/10'
                                                : currentStateBatch === batch.batchNumber
                                                    ? 'border-emerald-500/60 bg-emerald-500/10'
                                                    : 'border-turquoise-700/20 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-bold text-sm group-hover:text-gold-400 transition-colors flex items-center gap-2">
                                                    <Layers size={14} className="text-gold-400/60" /> Batch #{batch.batchNumber}
                                                </span>
                                                <span className="text-turquoise-600 text-[10px] font-bold">{batch.questions.length}Q</span>
                                            </div>
                                            {currentStateBatch === batch.batchNumber && (
                                                <p className="text-[10px] text-emerald-400 font-bold mt-1">← Participant's choice</p>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main: judging area */}
                    <div className="lg:col-span-3">
                        {activeBatch ? (
                            <div className="animate-slide-up space-y-6 pb-12">
                                {/* Batch Header */}
                                <div className="glass-card p-8 border-gold-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <BookOpen size={120} className="text-white" />
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center justify-center bg-gold-500/20 rounded-xl w-16 h-16 border border-gold-500/30">
                                                    <span className="text-3xl font-black text-gold-400">#{activeBatch.batchNumber}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                                        Batch {activeBatch.batchNumber}
                                                    </h3>
                                                    <p className="text-turquoise-400 text-xs font-bold">
                                                        {activeBatch.questions.length} question{activeBatch.questions.length > 1 ? 's' : ''} •{' '}
                                                        {activeParticipant ? activeParticipant.name : currentParticipant?.name || 'No participant active'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio Player */}
                                        {audioUrl && (
                                            <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
                                                <button
                                                    onClick={toggleAudio}
                                                    className="w-12 h-12 rounded-full bg-gold-500 text-turquoise-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gold-500/20"
                                                >
                                                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                                                </button>
                                                <div>
                                                    <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-1">Recitation</p>
                                                    <div className="flex items-center gap-2 text-white">
                                                        <Volume2 size={14} className="text-gold-400" />
                                                        <span className="text-xs font-bold">Surah {firstQ?.surahNumber}</span>
                                                    </div>
                                                </div>
                                                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Each question in the batch */}
                                    <div className="space-y-6">
                                        {activeBatch.questions.map((q: any, idx: number) => (
                                            <div key={q.id} className={`rounded-2xl border p-6 ${idx === 0 ? 'border-gold-500/20 bg-gold-500/5' : 'border-turquoise-500/20 bg-turquoise-500/5'}`}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.3em]">Question {idx + 1}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xl font-black text-white">{q.surah}</p>
                                                        <p className="font-arabic text-gold-400 text-lg">{q.surahArabic}</p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <div className="inline-block bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                                            <p className="text-xs text-turquoise-400 font-black uppercase tracking-widest">
                                                                Ayah {q.startAyah}–{q.endAyah}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arabic Quranic text */}
                                                {loadingQuran ? (
                                                    <div className="flex items-center gap-3 py-6 justify-center">
                                                        <Loader2 className="animate-spin text-gold-500" size={20} />
                                                        <p className="text-turquoise-600 text-xs uppercase font-bold tracking-widest">Loading verses...</p>
                                                    </div>
                                                ) : (
                                                    <div className="max-w-4xl font-arabic text-2xl md:text-3xl text-white leading-[3] text-right dir-rtl space-y-6 border-t border-white/5 pt-6 mt-4">
                                                        {getVerseRangeText(q).map((ayah: any) => (
                                                            <div key={ayah.number} className="relative group inline">
                                                                <span className="inline p-2 transition-all group-hover:bg-gold-500/10 rounded-xl leading-[3]">
                                                                    {ayah.text}
                                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold-500/30 text-gold-500 text-xs font-mono mx-3 italic align-middle">
                                                                        {ayah.number}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Judge Notes & Score */}
                                <div className="glass-card p-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {/* Points Input */}
                                            <div className="md:col-span-1 border-r border-white/10 pr-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText size={18} className="text-gold-400" />
                                                    <label className="text-[10px] font-black text-turquoise-500 uppercase tracking-[0.2em]">
                                                        Score / 100
                                                    </label>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={points}
                                                    onChange={(e) => setPoints(e.target.value ? Number(e.target.value) : '')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-3xl font-black text-center focus:outline-none focus:border-gold-500/50 transition-all placeholder:text-turquoise-900/50"
                                                    placeholder="--"
                                                    min="0"
                                                    max="100"
                                                />
                                            </div>

                                            {/* Notes Textarea */}
                                            <div className="md:col-span-3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText size={18} className="text-gold-400" />
                                                    <label className="text-[10px] font-black text-turquoise-500 uppercase tracking-[0.2em]">
                                                        Judge's Notes — Batch #{activeBatch.batchNumber}{activeParticipant ? ` • ${activeParticipant.name}` : currentParticipant ? ` • ${currentParticipant.name}` : ''}
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white min-h-[150px] focus:outline-none focus:border-gold-500/50 transition-all text-sm leading-relaxed placeholder:text-turquoise-900 font-medium"
                                                    placeholder="Document precision, tajweed rulings, breathing control, hesitations..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-6">
                                            <button
                                                onClick={() => { setActiveBatch(null); setNotes(''); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}
                                                className="flex-1 py-5 rounded-2xl border border-turquoise-800 text-turquoise-600 font-black uppercase tracking-widest hover:bg-turquoise-950/40 hover:text-white transition-all text-xs"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={saveNotes}
                                                disabled={saving}
                                                className="flex-[3] py-5 rounded-2xl bg-gold-500 text-turquoise-950 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gold-500/20 flex items-center justify-center gap-4 text-sm"
                                            >
                                                {saving
                                                    ? <Loader2 className="animate-spin" size={24} />
                                                    : <><Save size={20} /> Save Notes &amp; Confirm Batch</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty state */
                            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass-card border-dashed border-2 border-turquoise-500/20 opacity-40">
                                <div className="p-8 rounded-full bg-turquoise-500/5 mb-8 border border-turquoise-500/10">
                                    <Layers size={80} className="text-turquoise-800" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Session Inactive</h3>
                                <p className="text-turquoise-600 max-w-sm font-medium leading-relaxed">
                                    {currentStateBatch
                                        ? `Participant chose Batch #${currentStateBatch}. Select it from the sidebar to start judging.`
                                        : 'Set an active participant and wait for them to select a batch, or select a batch from the sidebar directly.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { @apply bg-transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-turquoise-800/20 rounded-full; }
                .dir-rtl { direction: rtl; }
            `}</style>
        </main>
    );
}
