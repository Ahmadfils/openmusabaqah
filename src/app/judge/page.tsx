'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Users, BookOpen, ChevronRight, Save, Edit2, RotateCcw, UserPlus, Play, Pause, Volume2, Loader2 } from 'lucide-react';

export default function JudgePage() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [selections, setSelections] = useState<any[]>([]);
    const [surahList, setSurahList] = useState<any[]>([]);

    // System State
    const [systemState, setSystemState] = useState<any>(null);
    const [nextParticipantId, setNextParticipantId] = useState('');

    // Active Judging Selection
    const [activeSelection, setActiveSelection] = useState<any>(null);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [editingSurahMaxAyah, setEditingSurahMaxAyah] = useState(0);
    const [score, setScore] = useState(0);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Quran Content State
    const [activeSurahData, setActiveSurahData] = useState<any>(null);
    const [loadingQuran, setLoadingQuran] = useState(false);

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetchInitialData();
        fetchSurahList();
    }, []);

    const fetchInitialData = async () => {
        const res = await fetch('/api/admin/groups');
        if (res.ok) {
            const data = await res.json();
            setGroups(data);
            if (data.length > 0) setSelectedGroupId(data[0].id);
        }
        setLoading(false);
    };

    const fetchSurahList = async () => {
        try {
            const res = await fetch('https://quranapi.pages.dev/api/surah.json');
            if (res.ok) setSurahList(await res.json());
        } catch (e) {
            console.error('Failed to fetch surah list', e);
        }
    };

    const fetchSurahDetail = async (surahNum: number) => {
        setLoadingQuran(true);
        try {
            const res = await fetch(`https://quranapi.pages.dev/api/${surahNum}.json`);
            if (res.ok) {
                const data = await res.json();
                setActiveSurahData(data);
                return data;
            }
        } catch (e) {
            console.error('Failed to fetch surah details', e);
        } finally {
            setLoadingQuran(false);
        }
        return null;
    };

    const fetchGroupData = useCallback(async (groupId: string) => {
        if (!groupId) return;
        const pRes = await fetch(`/api/admin/participants?groupId=${groupId}`);
        if (pRes.ok) setParticipants(await pRes.json());
        const sRes = await fetch(`/api/judge/selections?groupId=${groupId}`);
        if (sRes.ok) setSelections(await sRes.json());
        const stateRes = await fetch('/api/state');
        if (stateRes.ok) setSystemState(await stateRes.json());
    }, []);

    useEffect(() => {
        if (selectedGroupId) {
            fetchGroupData(selectedGroupId);
            const interval = setInterval(() => fetchGroupData(selectedGroupId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedGroupId, fetchGroupData]);

    const setNextUp = async () => {
        const res = await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: nextParticipantId || null,
                currentQuestionId: null,
            }),
        });
        if (res.ok) {
            setSystemState(await res.json());
        }
    };

    const startJudging = async (sel: any) => {
        setActiveSelection(sel);
        setEditingQuestion({ ...sel.question });
        setScore(sel.participant.score?.points || 0);
        setNotes(sel.participant.score?.notes || '');

        // Load Quran text and audio
        if (sel.question.surahNumber) {
            const surahData = await fetchSurahDetail(sel.question.surahNumber);
            if (surahData) setEditingSurahMaxAyah(surahData.totalAyah);
        }

        // Update system state
        fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroupId,
                currentParticipantId: sel.participantId,
                currentQuestionId: sel.questionId,
            }),
        });
    };

    const updateQuestionDetails = async () => {
        const res = await fetch('/api/admin/questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...editingQuestion,
                startAyah: Number(editingQuestion.startAyah),
                endAyah: Number(editingQuestion.endAyah)
            }),
        });
        if (res.ok) {
            const updatedQ = await res.json();
            setActiveSelection({ ...activeSelection, question: updatedQ });
            // Refresh Quran content if surah/ayah changed
            if (updatedQ.surahNumber !== activeSurahData?.surahNo) {
                fetchSurahDetail(updatedQ.surahNumber);
            }
            alert('Question details updated!');
        }
    };

    const saveScore = async () => {
        if (!activeSelection) return;
        setSaving(true);
        const res = await fetch('/api/judge/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: activeSelection.participantId,
                points: Number(score),
                notes,
            }),
        });
        if (res.ok) {
            setActiveSelection(null);
            fetchGroupData(selectedGroupId);
            fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentGroupId: selectedGroupId,
                    currentParticipantId: null,
                    currentQuestionId: null,
                }),
            });
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
        }
        setSaving(false);
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Extract text for range
    const getVerseRangeText = () => {
        if (!activeSurahData || !activeSelection) return [];
        const start = Number(activeSelection.question.startAyah) || 1;
        const end = Number(activeSelection.question.endAyah) || activeSurahData.totalAyah;
        return activeSurahData.arabic1.slice(start - 1, end).map((text: string, idx: number) => ({
            number: start + idx,
            text
        }));
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-turquoise-400">Initializing Judge Portal...</div>;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20">
            <div className="max-w-7xl mx-auto">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-8 glass-card px-6 py-4">
                    <div className="flex items-center gap-6">
                        <NextLink href="/" className="gold-text font-bold hover:scale-105 transition-all">OpenMusabaqah</NextLink>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-turquoise-500 text-xs font-bold uppercase tracking-widest">Active Group:</span>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="bg-transparent text-white font-bold focus:outline-none border-b border-gold-500/30 cursor-pointer"
                            >
                                {groups.map(g => <option key={g.id} value={g.id} className="bg-turquoise-900">{g.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <NextLink href="/admin" className="text-xs text-turquoise-400 hover:text-white uppercase tracking-tighter">Admin Settings</NextLink>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar: Control Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="flex items-center gap-2 text-white font-bold mb-6">
                                <Users size={18} className="text-gold-400" />
                                Next Turn Control
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-1.5 block">Select Participant</label>
                                    <select
                                        value={nextParticipantId}
                                        onChange={(e) => setNextParticipantId(e.target.value)}
                                        className="w-full bg-turquoise-900/40 border border-turquoise-700/50 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500/50"
                                    >
                                        <option value="">-- No one yet --</option>
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id} className="bg-turquoise-900">{p.name} {p.identifier ? `(${p.identifier})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={setNextUp}
                                    className="w-full btn-gold py-2 text-sm flex items-center justify-center gap-2"
                                >
                                    <ChevronRight size={16} /> Update Live Status
                                </button>

                                {systemState?.currentParticipantId && (
                                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                                        <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Currently Live:</p>
                                        <p className="text-white font-bold text-sm">
                                            {participants.find(p => p.id === systemState.currentParticipantId)?.name || 'Loading...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="flex items-center gap-2 text-white font-bold mb-4">
                                <RotateCcw size={18} className="text-gold-400" />
                                Recent Selections
                            </h2>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {selections.length === 0 ? (
                                    <p className="text-turquoise-800 italic text-sm">No selections yet...</p>
                                ) : (
                                    selections.slice(0, 15).map(sel => (
                                        <button
                                            key={sel.id}
                                            onClick={() => startJudging(sel)}
                                            className={`w-full p-3 rounded-xl border text-left transition-all group ${activeSelection?.id === sel.id ? 'border-gold-500 bg-gold-500/10' : 'border-turquoise-700/20 bg-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white font-bold text-sm group-hover:text-gold-400 transition-colors">{sel.participant.name}</span>
                                                <span className="text-gold-400 font-mono text-xs">#{sel.question.number}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-turquoise-500 uppercase font-bold">{sel.question.surah}</p>
                                                {sel.participant.score && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">Scored: {sel.participant.score.points}</span>}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main: Judging Context */}
                    <div className="lg:col-span-3">
                        {activeSelection ? (
                            <div className="animate-slide-up space-y-6 pb-12">
                                {/* Participant & Question Summary */}
                                <div className="glass-card p-8 border-gold-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <BookOpen size={120} className="text-white" />
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                        <div className="flex-1">
                                            <h3 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">{activeSelection.participant.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <p className="text-gold-400 font-black tracking-widest uppercase text-xs">
                                                    Question #{activeSelection.question.number} • {activeSelection.question.difficulty} Selection
                                                </p>
                                                <div className="h-4 w-px bg-white/20" />
                                                <span className="bg-turquoise-500/20 text-turquoise-400 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                    {activeSelection.participant.group?.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Audio Player */}
                                        <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
                                            <button
                                                onClick={toggleAudio}
                                                className="w-12 h-12 rounded-full bg-gold-500 text-turquoise-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gold-500/20"
                                            >
                                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                            </button>
                                            <div>
                                                <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-1">Recitation Audio</p>
                                                <div className="flex items-center gap-2 text-white">
                                                    <Volume2 size={14} className="text-gold-400" />
                                                    <span className="text-xs font-bold font-mono">Surah {activeSelection.question.surahNumber}</span>
                                                </div>
                                            </div>
                                            <audio
                                                ref={audioRef}
                                                src={activeSurahData?.audio["1"]?.url}
                                                onEnded={() => setIsPlaying(false)}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Real-time Question Edit */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-turquoise-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Edit2 size={12} /> Refine Selection
                                                </h4>
                                                <button onClick={updateQuestionDetails} className="text-[10px] bg-gold-500/10 text-gold-400 border border-gold-500/20 px-4 py-1.5 rounded-full font-black hover:bg-gold-500 hover:text-turquoise-950 transition-all uppercase tracking-widest">
                                                    Apply Update
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-[10px] text-turquoise-700 font-bold uppercase mb-1 block">Surah</label>
                                                    <select
                                                        value={editingQuestion.surahNumber - 1}
                                                        onChange={async (e) => {
                                                            const idx = Number(e.target.value);
                                                            const s = surahList[idx];
                                                            setEditingQuestion({ ...editingQuestion, surahNumber: idx + 1, surah: s.surahName, surahArabic: s.surahNameArabic });
                                                            setEditingSurahMaxAyah(s.totalAyah);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/40 appearance-none cursor-pointer"
                                                    >
                                                        {surahList.map((s, idx) => (
                                                            <option key={idx} value={idx} className="bg-turquoise-900">
                                                                {idx + 1}. {s.surahName} ({s.surahNameArabic})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] text-turquoise-700 font-bold uppercase mb-1 block">Start Ayah</label>
                                                    <select
                                                        value={editingQuestion.startAyah}
                                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, startAyah: Number(e.target.value) })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/40"
                                                    >
                                                        {Array.from({ length: editingSurahMaxAyah || 286 }, (_, i) => (
                                                            <option key={i + 1} value={i + 1} className="bg-turquoise-900">{i + 1}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-turquoise-700 font-bold uppercase mb-1 block">End Ayah</label>
                                                    <select
                                                        value={editingQuestion.endAyah}
                                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, endAyah: Number(e.target.value) })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500/40"
                                                    >
                                                        {Array.from({ length: (editingSurahMaxAyah || 286) - editingQuestion.startAyah + 1 }, (_, i) => (
                                                            <option key={i + editingQuestion.startAyah} value={i + editingQuestion.startAyah} className="bg-turquoise-900">{i + editingQuestion.startAyah}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Prompt Display */}
                                        <div className="flex flex-col">
                                            <h4 className="text-turquoise-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Original Prompt</h4>
                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 italic text-turquoise-100 text-sm leading-relaxed flex-1 flex items-center justify-center text-center">
                                                "{activeSelection.question.questionText}"
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quran Text Display */}
                                <div className="glass-card p-10 border-gold-500/10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-gold-500 text-xs font-black uppercase tracking-[0.3em]">Recitation Reference</h4>
                                        <div className="text-[10px] text-turquoise-600 font-bold uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                            {activeSurahData?.surahName} • {activeSelection.question.startAyah}-{activeSelection.question.endAyah}
                                        </div>
                                    </div>

                                    {loadingQuran ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="animate-spin text-gold-500" size={32} />
                                            <p className="text-xs text-turquoise-600 uppercase font-bold tracking-widest">Loading Divine Text...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-12">
                                            <div className="font-arabic text-4xl md:text-5xl text-white leading-[2.2] text-right dir-rtl space-y-10">
                                                {getVerseRangeText().map((ayah: any) => (
                                                    <div key={ayah.number} className="relative group">
                                                        <span className="inline-block p-4 transition-all group-hover:bg-gold-500/5 rounded-2xl">
                                                            {ayah.text}
                                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gold-500/40 text-gold-500 text-sm font-mono mr-4 italic">
                                                                {ayah.number}
                                                            </span>
                                                        </span>
                                                        <div className="h-px w-full bg-gradient-to-l from-gold-500/20 via-transparent to-transparent mt-4 opacity-50" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Scoring & Notes */}
                                <div className="glass-card p-8">
                                    <div className="space-y-8">
                                        <div>
                                            <div className="flex justify-between items-end mb-4 px-2">
                                                <label className="text-[10px] font-black text-turquoise-500 uppercase tracking-[0.2em]">Participant Performance Score</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-5xl font-black text-gold-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">{score}</span>
                                                    <span className="text-turquoise-800 font-black text-xl italic pt-2">/ {activeSelection.question.points}</span>
                                                </div>
                                            </div>
                                            <div className="relative h-12 flex items-center px-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={activeSelection.question.points}
                                                    step="1"
                                                    value={score}
                                                    onChange={(e) => setScore(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-turquoise-900 rounded-lg appearance-none cursor-pointer accent-gold-500 relative z-10"
                                                />
                                                <div className="absolute left-2 right-2 h-1.5 bg-white/5 border border-white/5 rounded-lg -z-0" />
                                            </div>
                                            <div className="flex justify-between mt-2 px-1">
                                                <span className="text-[10px] text-turquoise-800 font-black tracking-widest uppercase">Novice</span>
                                                <div className="flex gap-6">
                                                    {[0.25, 0.5, 0.75, 1].map(multiplier => (
                                                        <button
                                                            key={multiplier}
                                                            onClick={() => setScore(Math.floor(activeSelection.question.points * multiplier))}
                                                            className="text-[10px] text-turquoise-600 hover:text-gold-400 font-black transition-colors uppercase tracking-widest"
                                                        >
                                                            {multiplier * 100}%
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gold-900 font-black tracking-widest uppercase">Excellence</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-turquoise-500 uppercase tracking-[0.2em] mb-4 block">Confidential Observations</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-white min-h-[180px] focus:outline-none focus:border-gold-500/50 transition-all text-sm leading-relaxed placeholder:text-turquoise-900 font-medium"
                                                placeholder="Document precision, breathing control, tajweed rulings, and any hesitations..."
                                            />
                                        </div>

                                        <div className="flex gap-6">
                                            <button onClick={() => setActiveSelection(null)} className="flex-1 py-5 rounded-2xl border border-turquoise-800 text-turquoise-600 font-black uppercase tracking-widest hover:bg-turquoise-950/40 hover:text-white transition-all text-xs">Discard</button>
                                            <button
                                                onClick={saveScore}
                                                disabled={saving}
                                                className="flex-[3] py-5 rounded-2xl bg-gold-500 text-turquoise-950 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gold-500/20 flex items-center justify-center gap-4 text-sm"
                                            >
                                                {saving ? <Loader2 className="animate-spin text-turquoise-950" size={24} /> : <><Save size={20} /> Submit Score & Close Case</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass-card border-dashed border-2 border-turquoise-500/20 opacity-40">
                                <div className="p-8 rounded-full bg-turquoise-500/5 mb-8 border border-turquoise-500/10">
                                    <BookOpen size={80} className="text-turquoise-800" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Session Inactive</h3>
                                <p className="text-turquoise-600 max-w-sm font-medium leading-relaxed">
                                    Awaiting the next selection. Please activate a participant turn or select a pending question from the sidebar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    @apply h-6 w-6 rounded-full bg-gold-400 border-4 border-turquoise-950 shadow-xl shadow-gold-500/40 cursor-grab active:cursor-grabbing;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    @apply bg-transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    @apply bg-turquoise-800/20 rounded-full;
                }
                .dir-rtl {
                    direction: rtl;
                }
            `}</style>
        </main>
    );
}
