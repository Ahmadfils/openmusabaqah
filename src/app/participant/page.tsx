'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { CheckCircle2, Loader2, Sparkles, BookOpen } from 'lucide-react';

export default function ParticipantPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [batches, setBatches] = useState<{ batchNumber: number; isUsed: boolean }[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
    const [systemState, setSystemState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch('/api/admin/groups')
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setGroups(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch groups:', err);
                setLoading(false);
            });
    }, []);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch('/api/state');
            if (res.ok) setSystemState(await res.json());
        } catch (error) {
            console.error('Failed to fetch state:', error);
        }
    }, []);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 2500);
        return () => clearInterval(interval);
    }, [fetchState]);

    const selectGroup = async (group: any) => {
        setSelectedGroup(group);
        setSelectedBatch(null);
        try {
            // Fetch all batch numbers for this group via judge/selections endpoint
            const res = await fetch(`/api/judge/selections?groupId=${group.id}`);
            if (res.ok) {
                const data = await res.json();
                setBatches(data.map((b: any) => ({ batchNumber: b.batchNumber, isUsed: b.isUsed })));
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error);
        }
    };

    const selectBatch = async (batchNumber: number) => {
        if (selectedBatch !== null) return; // already selected
        setSelectedBatch(batchNumber);

        // Broadcast that this participant picked this batch
        await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentGroupId: selectedGroup?.id,
                currentBatchNumber: batchNumber,
            }),
        });

        if (audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
    };

    // The confirmed batch from judge (after they save notes, currentBatchNumber is set)
    const confirmedBatch = systemState?.currentBatchNumber;

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-turquoise-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold tracking-widest uppercase text-xs">Connecting to Server...</p>
        </div>
    );

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20">
            <audio ref={audioRef} src="/sounds/takbeer.mp3" />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 glass-card px-6 py-4">
                    <NextLink href="/" className="gold-text font-bold hover:scale-105 transition-all flex items-center gap-2">
                        <Sparkles size={18} /> OpenMusabaqah
                    </NextLink>
                    {selectedGroup && (
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-tighter">Group</p>
                                <p className="text-white font-bold text-sm">{selectedGroup.name}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedGroup(null); setSelectedBatch(null); setError(''); }}
                                className="text-[10px] text-turquoise-600 hover:text-white border border-turquoise-700/30 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-colors"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* ── CONFIRMED BATCH DISPLAY (judge saved notes) ── */}
                {confirmedBatch && selectedGroup && (
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

                            <button
                                onClick={() => { setSelectedBatch(null); setSelectedGroup(null); }}
                                className="mt-8 text-[10px] text-turquoise-600 hover:text-white uppercase tracking-[0.3em] font-black transition-colors"
                            >
                                Back to Group Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: SELECT GROUP ── */}
                {!selectedGroup && (
                    <div className="animate-slide-up text-center">
                        <h1 className="text-6xl font-black text-white mb-4 uppercase tracking-tighter">
                            Join <span className="gold-text">Competition</span>
                        </h1>
                        <p className="font-arabic text-gold-500/60 text-3xl mb-12">اختر مجموعة المسابقة</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {groups.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => selectGroup(g)}
                                    className="glass-card p-12 hover:border-gold-500/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CheckCircle2 size={120} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white group-hover:text-gold-400 transition-colors uppercase tracking-tight">{g.name}</h2>
                                    <p className="text-turquoise-400/60 text-sm mt-3 font-medium">{g.description}</p>
                                    <div className="mt-8 flex items-center justify-center gap-2 text-gold-500 font-black uppercase text-[10px] tracking-[0.2em]">
                                        Enter Group →
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: SELECT BATCH NUMBER ── */}
                {selectedGroup && !confirmedBatch && (
                    <div className="animate-slide-up">
                        <div className="text-center mb-16">
                            <h1 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">
                                Pick Your <span className="gold-text">Batch</span>
                            </h1>
                            <p className="font-arabic text-gold-500/50 text-2xl">اختر رقم الدفعة</p>
                        </div>

                        {selectedBatch !== null ? (
                            /* Waiting screen after selection */
                            <div className="glass-card p-16 text-center border-emerald-500/20 relative overflow-hidden max-w-3xl mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                                <div className="text-7xl mb-8">🕋</div>
                                <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter mb-4">Selection Locked</h2>
                                <div className="mt-8 mb-10 inline-block py-10 px-20 rounded-[40px] bg-white/5 border border-white/10 shadow-2xl">
                                    <p className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.3em] mb-4">Your Batch</p>
                                    <p className="text-9xl font-black text-white tracking-tighter">#{selectedBatch}</p>
                                </div>
                                <p className="text-turquoise-400/60 max-w-md mx-auto text-sm leading-relaxed font-medium">
                                    Your batch selection has been sent to the judge. Please wait for confirmation.
                                </p>
                                <div className="flex items-center justify-center gap-3 mt-8">
                                    <Loader2 className="animate-spin text-gold-500" size={20} />
                                    <p className="text-turquoise-600 text-xs font-bold uppercase tracking-widest">Awaiting Judge Confirmation...</p>
                                </div>
                                <div className="ornament-divider max-w-xs mx-auto my-12 opacity-10" />
                                <p className="font-arabic text-gold-600/30 text-4xl">بالتوفيق والنجاح</p>
                            </div>
                        ) : (
                            /* Batch grid */
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {error && <p className="text-center bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">{error}</p>}
                                {batches.length === 0 ? (
                                    <div className="glass-card p-16 text-center border-dashed border-2 border-turquoise-500/20 text-turquoise-700 italic">
                                        No batches configured for this group yet. Contact the administrator.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        {batches
                                            .sort((a, b) => a.batchNumber - b.batchNumber)
                                            .map(({ batchNumber, isUsed }) => (
                                                <button
                                                    key={batchNumber}
                                                    disabled={isUsed}
                                                    onClick={() => selectBatch(batchNumber)}
                                                    className={isUsed
                                                        ? 'number-tile-used opacity-30 cursor-not-allowed h-24 text-xl'
                                                        : 'number-tile-available h-24 text-3xl font-black hover:scale-105 active:scale-95'}
                                                >
                                                    {batchNumber}
                                                </button>
                                            ))}
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-4 mt-12 opacity-60">
                                    <div className="h-px w-24 bg-turquoise-800/30" />
                                    <p className="text-center text-turquoise-700 text-[10px] font-black uppercase tracking-[0.4em]">
                                        Faded batches are already taken
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
