'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { CheckCircle2, Loader2, Sparkles, User, LogOut, BookOpen } from 'lucide-react';

export default function ParticipantPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [me, setMe] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [selection, setSelection] = useState<any>(null);
    const [systemState, setSystemState] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const res = await fetch('/api/admin/groups');
        if (res.ok) setGroups(await res.json());
        setLoading(false);
    };

    const fetchState = useCallback(async () => {
        const res = await fetch('/api/state');
        if (res.ok) setSystemState(await res.json());
    }, []);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 3000);
        return () => clearInterval(interval);
    }, [fetchState]);

    const selectGroup = async (group: any) => {
        setSelectedGroup(group);
        const res = await fetch(`/api/admin/participants?groupId=${group.id}`);
        if (res.ok) setParticipants(await res.json());

        const qRes = await fetch(`/api/admin/questions?groupId=${group.id}`);
        if (qRes.ok) setQuestions(await qRes.json());
    };

    const registerAs = async (participant: any) => {
        setMe(participant);
        // Refresh selection status
        const res = await fetch(`/api/participants/selection?participantId=${participant.id}`);
        if (res.ok) {
            const data = await res.json();
            if (data.selection) setSelection(data.selection);
        }
    };

    const selectNumber = async (question: any) => {
        if (!me || selection) return;

        const res = await fetch('/api/participants/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId: me.id, questionId: question.id }),
        });

        if (res.ok) {
            setSelection({ question });
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } else {
            const err = await res.json();
            setError(err.error || 'Selection failed');
        }
    };

    const isMyTurn = systemState?.currentParticipantId === me?.id;
    const activeQuestionId = systemState?.currentQuestionId;
    const activeQuestion = questions.find(q => q.id === activeQuestionId);

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
                <div className="flex items-center justify-between mb-12 glass-card px-6 py-4">
                    <NextLink href="/" className="gold-text font-bold hover:scale-105 transition-all flex items-center gap-2">
                        <Sparkles size={18} /> OpenMusabaqah
                    </NextLink>
                    {me && (
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-tighter">Participant</p>
                                <p className="text-white font-bold text-sm">{me.name}</p>
                            </div>
                            <button onClick={() => setMe(null)} className="text-turquoise-700 hover:text-red-400 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* State: Live Recitation Overlay */}
                {isMyTurn && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-turquoise-950/90 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                        <div className="max-w-xl w-full text-center">
                            <div className="mb-8 inline-block p-4 rounded-full bg-gold-500/10 border-2 border-gold-500/20 shadow-2xl shadow-gold-500/10">
                                <User size={80} className="text-gold-500" />
                            </div>
                            <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">It's Your Turn!</h2>
                            <p className="font-arabic text-gold-500 text-3xl mb-8">حان دورك الآن</p>

                            {activeQuestion ? (
                                <div className="glass-card p-10 border-gold-500/30 animate-pulse-gold relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <BookOpen size={100} className="text-white" />
                                    </div>
                                    <p className="text-turquoise-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Assigned Question</p>
                                    <h3 className="text-9xl font-black text-white mb-6 tracking-tighter">#{activeQuestion.number}</h3>

                                    <div className="ornament-divider max-w-xs mx-auto my-8 opacity-20" />

                                    <div className="space-y-4">
                                        <p className="text-3xl font-black text-gold-400 uppercase tracking-tight">{activeQuestion.surah}</p>
                                        <p className="font-arabic text-4xl text-white">{activeQuestion.surahArabic}</p>
                                        {activeQuestion.startAyah && (
                                            <div className="inline-block bg-white/5 px-6 py-2 rounded-full border border-white/10 mt-4">
                                                <p className="text-xs text-turquoise-500 font-black uppercase tracking-widest">
                                                    Ayah Range: {activeQuestion.startAyah} — {activeQuestion.endAyah || '?'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card p-10 border-turquoise-500/30">
                                    <p className="text-turquoise-400 text-sm font-bold uppercase tracking-widest mb-4">Awaiting Question Selection</p>
                                    <div className="flex justify-center">
                                        <Loader2 className="animate-spin text-gold-500" size={32} />
                                    </div>
                                    <p className="text-white mt-6 italic font-medium">The judge is preparing your question. Please be ready.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 1: Select Group */}
                {!selectedGroup && (
                    <div className="animate-slide-up text-center">
                        <h1 className="text-6xl font-black text-white mb-4 uppercase tracking-tighter">Join <span className="gold-text">Competition</span></h1>
                        <p className="font-arabic text-gold-500/60 text-3xl mb-12">اختر مجموعة المسابقة</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {groups.map(g => (
                                <button key={g.id} onClick={() => selectGroup(g)} className="glass-card p-12 hover:border-gold-500/50 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CheckCircle2 size={120} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white group-hover:text-gold-400 transition-colors uppercase tracking-tight">{g.name}</h2>
                                    <p className="text-turquoise-400/60 text-sm mt-3 font-medium">{g.description}</p>
                                    <div className="mt-8 flex items-center justify-center gap-2 text-gold-500 font-black uppercase text-[10px] tracking-[0.2em] group-hover:gap-4 transition-all">
                                        Enter Group <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Identify Yourself */}
                {selectedGroup && !me && (
                    <div className="animate-slide-up max-w-2xl mx-auto">
                        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-[10px] text-turquoise-500 mb-10 hover:text-white transition-colors uppercase tracking-[0.2em] font-black">
                            <ChevronLeft size={14} /> Change Group
                        </button>
                        <h1 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Identify <span className="gold-text">Yourself</span></h1>
                        <p className="text-turquoise-400/60 mb-12 font-medium">Select your name from the {selectedGroup.name} roster.</p>
                        <div className="grid grid-cols-1 gap-4">
                            {participants.length === 0 ? (
                                <div className="glass-card p-16 text-center text-turquoise-700 italic border-dashed border-2">
                                    No participants registered in this group yet.
                                </div>
                            ) : (
                                participants.map(p => (
                                    <button key={p.id} onClick={() => registerAs(p)} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-gold-500/10 hover:border-gold-500/30 transition-all group">
                                        <div>
                                            <p className="font-black text-xl group-hover:text-gold-400 transition-colors tracking-tight uppercase">{p.name}</p>
                                            <p className="text-[10px] text-turquoise-700 font-black tracking-[0.3em] uppercase mt-1">{p.identifier || 'No ID'}</p>
                                        </div>
                                        <ChevronRight size={20} className="text-turquoise-800 group-hover:text-gold-500 transition-all translate-x-0 group-hover:translate-x-2" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Selection Grid */}
                {me && !isMyTurn && (
                    <div className="animate-slide-up">
                        <div className="text-center mb-16">
                            <h1 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">Pick Your <span className="gold-text">Fortune</span></h1>
                            <p className="font-arabic text-gold-500/50 text-2xl">اختر رقم سؤالك</p>
                        </div>

                        {selection ? (
                            <div className="glass-card p-16 text-center border-emerald-500/20 relative overflow-hidden max-w-3xl mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                                <div className="text-7xl mb-8">🕋</div>
                                <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter mb-4">Selection Locked</h2>
                                <div className="mt-8 mb-10 inline-block py-10 px-20 rounded-[40px] bg-white/5 border border-white/10 shadow-2xl">
                                    <p className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.3em] mb-4">Your Number</p>
                                    <p className="text-9xl font-black text-white tracking-tighter">#{selection.question.number}</p>
                                </div>
                                <p className="text-turquoise-400/60 max-w-md mx-auto text-sm leading-relaxed font-medium">
                                    Your selection is registered and displayed to the judges. Please watch the main display. The session will activate shortly.
                                </p>
                                <div className="ornament-divider max-w-xs mx-auto my-12 opacity-10" />
                                <p className="font-arabic text-gold-600/30 text-4xl">بالتوفيق والنجاح</p>
                            </div>
                        ) : (
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {error && <p className="text-center bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest animate-shake">{error}</p>}
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-4">
                                    {questions.sort((a, b) => a.number - b.number).map(q => (
                                        <button
                                            key={q.id}
                                            disabled={q.isUsed}
                                            onClick={() => selectNumber(q)}
                                            className={q.isUsed ? 'number-tile-used opacity-30 cursor-not-allowed h-24 text-xl' : 'number-tile-available h-24 text-3xl font-black hover:scale-105 active:scale-95'}
                                        >
                                            {q.number}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col items-center gap-4 mt-12 opacity-60">
                                    <div className="h-px w-24 bg-turquoise-800/30" />
                                    <p className="text-center text-turquoise-700 text-[10px] font-black uppercase tracking-[0.4em]">
                                        Golden numbers are already taken
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

function ChevronLeft({ size = 24, className = '' }: { size?: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>
}
function ChevronRight({ size = 24, className = '' }: { size?: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
}
