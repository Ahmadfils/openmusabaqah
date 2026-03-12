'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Users, BookOpen, ChevronRight, Save, RotateCcw, Play, Pause, Volume2, Loader2, Layers, FileText, Layout } from 'lucide-react';
import ScoringTable from './ScoringTable';

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
        if (!nextParticipantId) {
            alert('Please select a participant first.');
            return;
        }
        if (activeBatch && systemState?.currentParticipantId && systemState?.currentBatchNumber !== null) {
            alert('Finish judging the current participant first. Either save or discard to move to the next participant.');
            return;
        }

        const res = await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: nextParticipantId,
                currentBatchNumber: null,
                status: 'waiting_batch',
            }),
        });
        if (res.ok) {
            const newState = await res.json();
            setSystemState(newState);
        } else {
            alert('Failed to set active participant. Try again.');
        }
    };

    const startJudging = async (batch: any) => {
        setActiveBatch(batch);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        if (systemState?.currentParticipantId) {
            const participant = participants.find(p => p.id === systemState.currentParticipantId);
            setActiveParticipant(participant || null);
            if (participant?.score) {
                setPoints(participant.score.points ?? '');
            } else {
                setPoints('');
            }
        } else {
            setPoints('');
        }

        setLoadingQuran(true);
        for (const q of batch.questions) {
            if (q.surahNumber) await fetchSurahDetail(q.surahNumber);
        }
        setLoadingQuran(false);

        await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: systemState?.currentParticipantId || null,
                currentBatchNumber: batch.batchNumber,
                status: 'judging',
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
                notes: 'Scoring Table used',
                points: points === '' ? null : Number(points),
                currentBatchNumber: activeBatch.batchNumber,
                groupId: selectedGroupId,
            }),
        });
        if (res.ok) {
            handleDiscard();
        }
        setSaving(false);
    };

    const handleDiscard = async (isManualDiscard = false) => {
        setActiveBatch(null);
        setActiveParticipant(null);
        setPoints('');
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        setSystemState({
            id: 'default',
            currentGroupId: null,
            currentParticipantId: null,
            currentBatchNumber: null,
            status: 'inactive'
        });

        if (isManualDiscard) {
            await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reset: true }),
            });
        }

        setNextParticipantId('');
        fetchGroupData(selectedGroupId);
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
    const currentStateBatch = systemState?.currentBatchNumber;
    const selectedByParticipant = batches.find(b => b.batchNumber === currentStateBatch);

    useEffect(() => {
        if (currentStateBatch && selectedByParticipant && activeBatch?.batchNumber !== currentStateBatch) {
            startJudging(selectedByParticipant);
        }
    }, [currentStateBatch, selectedByParticipant, activeBatch]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-turquoise-400">Initializing Judge Portal...</div>;

    const firstQ = activeBatch?.questions?.[0];
    const audioUrl = firstQ ? surahDataMap[firstQ.surahNumber]?.audio?.['1']?.url : undefined;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20">
            <div className="max-w-7xl mx-auto">
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
                    <div className="lg:col-span-1 space-y-6">
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

                        <div className="glass-card p-6">
                            <h2 className="flex items-center gap-2 text-white font-bold mb-4">
                                <RotateCcw size={18} className="text-gold-400" /> Batches
                            </h2>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {batches.filter(b => !b.isUsed).length === 0 ? (
                                    <p className="text-turquoise-800 italic text-sm">No available batches...</p>
                                ) : (
                                    batches.filter(b => !b.isUsed).sort((a, b) => a.batchNumber - b.batchNumber).map(batch => (
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
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                                {/* Left Side: Quran Recitation */}
                                <div className="xl:col-span-9 animate-slide-up space-y-6">
                                    <div className="glass-card p-4 md:p-6 border-gold-500/20 relative overflow-hidden flex flex-col max-h-[88vh]">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <BookOpen size={120} className="text-white" />
                                        </div>

                                        <div className="flex items-center justify-between gap-6 mb-4 flex-shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gold-500/20 px-3 py-1 rounded-full border border-gold-500/30">
                                                    <span className="text-xs font-black text-gold-400">Batch #{activeBatch.batchNumber}</span>
                                                </div>
                                                <p className="text-turquoise-400 text-[10px] font-bold uppercase tracking-widest">
                                                    {activeParticipant ? activeParticipant.name : currentParticipant?.name || 'No participant active'}
                                                </p>
                                            </div>

                                            {/* Audio Player */}
                                            {audioUrl && (
                                                <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-3 py-2 border border-white/10">
                                                    <button
                                                        onClick={toggleAudio}
                                                        className="w-8 h-8 rounded-full bg-gold-500 text-turquoise-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gold-500/20"
                                                    >
                                                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-1" />}
                                                    </button>
                                                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Scrollable Quran Area */}
                                        <div className="overflow-y-auto pr-2 md:pr-4 custom-scrollbar space-y-6 pb-4">
                                            {activeBatch.questions.map((q: any, idx: number) => (
                                                <div key={q.id} className={`rounded-2xl border p-4 md:p-6 ${idx === 0 ? 'border-gold-500/20 bg-gold-500/5' : 'border-turquoise-500/20 bg-turquoise-500/5'}`}>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.3em]">Question {idx + 1}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                                            {q.difficulty}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4 mb-6">
                                                        <div>
                                                            <p className="text-2xl md:text-3xl font-black text-white">{q.surah}</p>
                                                            <p className="font-arabic text-gold-400 text-lg md:text-xl mt-1">{q.surahArabic}</p>
                                                        </div>
                                                        <div className="inline-block bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                                            <p className="text-[10px] text-turquoise-400 font-black uppercase tracking-widest">
                                                                Ayah {q.startAyah}–{q.endAyah}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {loadingQuran ? (
                                                        <div className="flex items-center gap-3 py-6 justify-center">
                                                            <Loader2 className="animate-spin text-gold-500" size={20} />
                                                        </div>
                                                    ) : (
                                                        <div className="max-w-4xl font-arabic text-2xl md:text-3xl text-white text-right dir-rtl pt-4 mt-2">
                                                            {getVerseRangeText(q).map((ayah: any) => (
                                                                <div 
                                                                    key={ayah.number} 
                                                                    className="transition-all hover:text-gold-100 leading-[3.0] pb-8 border-b border-white/10 last:border-0 mb-2"
                                                                    style={{
                                                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                                                                        backgroundSize: '100% 3.0em',
                                                                        backgroundPosition: '0 2.6em'
                                                                    }}
                                                                >
                                                                    {ayah.text}
                                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold-500/30 text-gold-500 text-[10px] font-mono mx-3 italic align-middle mb-1 bg-turquoise-900/40">
                                                                        {ayah.number}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Scoring & Controls */}
                                <div className="xl:col-span-3 space-y-6 sticky top-8">
                                    <ScoringTable onTotalChange={(total) => setPoints(total)} />

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => handleDiscard(true)}
                                            className="w-full py-3 rounded-2xl border border-turquoise-800 text-turquoise-600 font-black uppercase tracking-widest hover:bg-turquoise-950/40 hover:text-white transition-all text-[9px]"
                                        >
                                            Discard Session
                                        </button>
                                        <button
                                            onClick={saveNotes}
                                            disabled={saving}
                                            className="w-full py-4 rounded-2xl bg-gold-500 text-turquoise-950 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gold-500/20 flex items-center justify-center gap-3 text-[10px]"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={16} /> Save &amp; Finish</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
