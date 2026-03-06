'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { CheckCircle2, Loader2, Sparkles, BookOpen, Clock } from 'lucide-react';

export default function ParticipantPage() {
    const [batches, setBatches] = useState<{ batchNumber: number; isUsed: boolean }[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
    const [systemState, setSystemState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch('/api/state');
            if (res.ok) {
                const state = await res.json();
                setSystemState(state);

                // If the judge selected an active participant, and we haven't fetched the batches yet
                if (state.currentParticipantId && state.currentGroupId) {
                    fetchBatches(state.currentGroupId);
                } else if (!state.currentParticipantId) {
                    // Reset if no active participant
                    setBatches([]);
                    setSelectedBatch(null);
                }
            }
        } catch (error) {
            // Silently ignore polling errors to prevent dev overlays
            // console.error('Failed to fetch state:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBatches = async (groupId: string) => {
        try {
            const res = await fetch(`/api/judge/selections?groupId=${groupId}`);
            if (res.ok) {
                const data = await res.json();
                // Avoid infinite re-renders by only setting if length changes or we have no batches
                setBatches(data.map((b: any) => ({ batchNumber: b.batchNumber, isUsed: b.isUsed })));
            }
        } catch (error) {
            // Silently ignore polling errors
            // console.error('Failed to fetch batches:', error);
        }
    };

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 2500);
        return () => clearInterval(interval);
    }, [fetchState]);

    const selectBatch = async (batchNumber: number) => {
        if (selectedBatch !== null) return; // already selected
        setSelectedBatch(batchNumber);

        // Broadcast that this participant picked this batch
        try {
            await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentGroupId: systemState.currentGroupId,
                    currentParticipantId: systemState.currentParticipantId,
                    currentBatchNumber: batchNumber,
                }),
            });
            // Play success sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.error('Failed to select batch:', error);
            setSelectedBatch(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-turquoise-950 flex items-center justify-center p-6 text-white font-sans selection:bg-gold-500/30">
            <Loader2 className="animate-spin text-gold-500" size={48} />
        </div>
    );

    const isJudgeActive = systemState?.currentParticipantId;
    const confirmedBatch = systemState?.currentBatchNumber;

    return (
        <div className="min-h-screen bg-turquoise-950 bg-[url('/pattern.svg')] bg-fixed bg-opacity-5 flex items-center justify-center p-6 text-white font-sans selection:bg-gold-500/30 overflow-x-hidden">
            {/* Audio element for ding sound */}
            <audio ref={audioRef} src="/ding.mp3" preload="auto" />

            <div className="fixed inset-0 bg-gradient-to-br from-turquoise-900/50 via-turquoise-950 to-black/80 pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold-600/10 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-turquoise-600/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-6xl w-full z-10 relative">

                {/* ── HEADER ── */}
                <div className="flex justify-between items-center mb-16 animate-slide-down">
                    <NextLink href="/" className="inline-flex items-center gap-3 text-gold-500 hover:text-gold-400 font-bold tracking-widest text-sm uppercase transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                            <BookOpen size={18} />
                        </div>
                        OpenMusabaqah
                    </NextLink>
                    <div className="text-right">
                        <h2 className="text-3xl font-arabic text-gold-400 mb-1">المتسابق</h2>
                        <p className="text-turquoise-400/60 font-black tracking-[0.2em] text-xs uppercase">Participant Portal</p>
                    </div>
                </div>

                {/* ── HOLDING SCREEN: Waiting for judge ── */}
                {!isJudgeActive && (
                    <div className="animate-slide-up text-center py-20">
                        <div className="mb-8 inline-block p-6 rounded-full bg-gold-500/10 border-2 border-gold-500/20 shadow-2xl animate-pulse">
                            <Clock size={64} className="text-gold-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase">
                            Waiting for <span className="gold-text">Judge</span>
                        </h1>
                        <p className="text-turquoise-400/60 text-lg max-w-lg mx-auto mb-8 font-medium">
                            Please wait while the judge assigns your turn. Your questions will appear here shortly.
                        </p>
                        <p className="font-arabic text-gold-500/50 text-4xl">يرجى الانتظار حتى يتم تحديد دورك</p>
                    </div>
                )}

                {/* ── CONFIRMED BATCH OVERLAY ── */}
                {confirmedBatch !== null && isJudgeActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-turquoise-950/95 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                        <div className="max-w-lg w-full text-center">
                            <div className="mb-8 inline-block p-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 shadow-2xl">
                                <CheckCircle2 size={80} className="text-emerald-400" />
                            </div>
                            <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Batch Confirmed!</h2>
                            <p className="font-arabic text-gold-500 text-3xl mb-8">تأكيد الدفعة</p>

                            <div className="glass-card p-12 border-gold-500/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <BookOpen size={100} className="text-white" />
                                </div>
                                <p className="text-turquoise-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Your Assigned Batch</p>
                                <h3 className="text-9xl font-black text-white mb-6 tracking-tighter">#{confirmedBatch}</h3>
                                <div className="ornament-divider max-w-xs mx-auto my-8 opacity-20" />
                                <p className="text-turquoise-400/60 text-sm leading-relaxed font-medium">
                                    The judge has confirmed your batch. Please await further instructions from the session coordinator.
                                </p>
                                <p className="font-arabic text-gold-600/30 text-4xl mt-8">بالتوفيق والنجاح</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BATCH SELECTION GRID ── */}
                {isJudgeActive && confirmedBatch === null && batches.filter(b => !b.isUsed).length > 0 && (
                    <div className="animate-slide-up text-center">
                        <p className="text-turquoise-400 font-black tracking-[0.2em] text-xs uppercase mb-4 flex items-center justify-center gap-2">
                            <Sparkles size={14} className="text-gold-500" /> Choose Your Destiny
                        </p>
                        <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Select a Batch</h2>
                        <p className="font-arabic text-gold-500 text-3xl mb-12">اختر رقم الدفعة</p>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 relative">
                            {batches.filter(b => !b.isUsed).map((b) => {
                                const isPicked = selectedBatch === b.batchNumber;
                                return (
                                    <button
                                        key={b.batchNumber}
                                        disabled={selectedBatch !== null && !isPicked}
                                        onClick={() => selectBatch(b.batchNumber)}
                                        className={`
                                            aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl font-black transition-all duration-300 relative overflow-hidden
                                            ${isPicked
                                                ? 'bg-gold-500 text-turquoise-950 scale-105 shadow-[0_0_40px_rgba(234,179,8,0.4)] border-2 border-gold-400 z-10'
                                                : 'glass-card text-white hover:border-gold-500/50 hover:text-gold-400 hover:-translate-y-1 shadow-xl'
                                            }
                                            ${selectedBatch !== null && !isPicked ? 'opacity-30 scale-95' : ''}
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                                        <span className="relative z-10">{b.batchNumber}</span>
                                        {isPicked && (
                                            <div className="absolute inset-0 border-4 border-white/20 rounded-2xl animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedBatch !== null && (
                            <div className="mt-16 animate-fade-in p-6 glass-card border-gold-500/30 max-w-md mx-auto relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <BookOpen size={60} className="text-gold-500" />
                                </div>
                                <div className="flex items-center justify-center gap-3 text-gold-400 mb-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    <span className="font-black tracking-[0.2em] text-[10px] uppercase">Selection Locked</span>
                                </div>
                                <p className="text-white font-medium text-lg">Waiting for the judge to proceed with Batch #{selectedBatch}...</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
