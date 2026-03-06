'use client';
import { useState, useEffect, useCallback } from 'react';
import NextLink from 'next/link';
import { Trophy, Medal, ChevronLeft, Loader2, Users, Star } from 'lucide-react';

export default function ResultsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/admin/groups');
            if (res.ok) setGroups(await res.json());
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRankings = useCallback(async () => {
        if (!selectedGroup) return;
        try {
            const res = await fetch(`/api/results?groupId=${selectedGroup.id}`);
            if (res.ok) {
                const data = await res.json();
                // Sort by points descending, filtering those without scores if needed or just showing 0
                setRankings(data); // already sorted by server
            }
        } catch (error) {
            // Silently ignore polling errors
            // console.error('Failed to fetch rankings:', error);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedGroup) {
            fetchRankings();
            const interval = setInterval(fetchRankings, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedGroup, fetchRankings]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-turquoise-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold tracking-widest uppercase text-xs">Loading Rankings...</p>
        </div>
    );

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 glass-card px-6 py-4">
                    <NextLink href="/" className="gold-text font-bold hover:scale-105 transition-all flex items-center gap-2">
                        <Trophy size={18} /> OpenMusabaqah
                    </NextLink>
                    {selectedGroup && (
                        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-xs text-turquoise-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
                            <ChevronLeft size={14} /> Other Groups
                        </button>
                    )}
                </div>

                {!selectedGroup ? (
                    <div className="text-center animate-slide-up">
                        <div className="mb-6 inline-block p-4 rounded-full bg-gold-500/10 border-2 border-gold-500/20">
                            <Users size={64} className="text-gold-500" />
                        </div>
                        <h1 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">Leaderboards</h1>
                        <p className="font-arabic text-gold-500/60 text-3xl mb-12">لوحات الصدارة</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {groups.map(g => (
                                <button key={g.id} onClick={() => setSelectedGroup(g)} className="glass-card p-12 hover:border-gold-500/50 transition-all group relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Trophy size={140} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white group-hover:text-gold-400 transition-colors uppercase tracking-tighter">{g.name}</h2>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-turquoise-600 font-bold uppercase text-[10px] tracking-[0.2em]">
                                        View Rankings <Star size={10} className="fill-current" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <div className="text-center mb-16 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 blur-[120px] bg-gold-500/20 w-64 h-64 rounded-full" />
                            <h1 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">{selectedGroup.name}</h1>
                            <p className="font-arabic text-gold-500/70 text-2xl tracking-widest">نتائج المسابقة</p>
                            <div className="ornament-divider max-w-xs mx-auto my-6 opacity-40" />
                        </div>

                        <div className="space-y-6 max-w-4xl mx-auto">
                            {rankings.length === 0 ? (
                                <div className="glass-card p-20 text-center text-turquoise-800 italic border-dashed border-2">
                                    No records found for this group.
                                </div>
                            ) : (
                                rankings.map((p, i) => {
                                    const isTopThree = i < 3;
                                    const colors = i === 0 ? 'text-gold-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-turquoise-700';

                                    return (
                                        <NextLink
                                            key={p.id}
                                            href={`/results/${p.id}`}
                                            className={`glass-card p-6 flex flex-col md:flex-row items-center gap-8 border-l-8 transition-all hover:scale-[1.01] ${isTopThree ? 'border-gold-500 bg-gold-500/5' : 'border-turquoise-900 bg-white/5'}`}
                                        >
                                            <div className={`text-5xl font-black ${colors} w-16 text-center italic`}>
                                                {i + 1}
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">{p.name}</h3>
                                                    {i === 0 && <span className="bg-gold-500 text-turquoise-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block w-fit mx-auto md:mx-0">Champion</span>}
                                                </div>
                                                <p className="text-turquoise-400/60 text-sm mt-2 italic font-medium leading-relaxed max-w-xl truncate">
                                                    {p.score?.notes ? `"${p.score.notes}"` : "Results pending judge review..."}
                                                </p>
                                            </div>

                                            <div className="flex-none text-right">
                                                {p.score?.points !== null && p.score?.points !== undefined ? (
                                                    <div>
                                                        <span className="text-5xl font-black text-white">{p.score.points}</span>
                                                        <span className="text-gold-500 font-bold ml-1">pts</span>
                                                    </div>
                                                ) : p.score?.notes ? (
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Reviewed</span>
                                                ) : (
                                                    <span className="bg-turquoise-900/40 text-turquoise-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>
                                                )}
                                                <p className="text-[10px] text-turquoise-500 mt-2 hover:text-white uppercase tracking-widest font-bold">View Details →</p>
                                            </div>
                                        </NextLink>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
