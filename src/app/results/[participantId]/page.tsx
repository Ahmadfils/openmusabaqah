import { prisma } from '@/lib/prisma';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { Trophy, ChevronLeft, User, Star, FileText, CheckCircle2, Loader2 } from 'lucide-react';

export default async function ParticipantDetailsPage({ params }: { params: { participantId: string } }) {
    const { participantId } = params;

    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
            group: true,
            score: true,
        }
    });

    if (!participant) {
        notFound();
    }

    const { score, group } = participant;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-turquoise-950/20 bg-[url('/pattern.svg')] bg-fixed bg-opacity-5">
            <div className="max-w-4xl mx-auto mt-12">
                {/* Nav Header */}
                <div className="flex items-center justify-between mb-8 animate-slide-down">
                    <NextLink href="/results" className="flex items-center gap-2 text-gold-500 hover:text-gold-400 font-bold uppercase tracking-widest text-sm transition-colors group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Leaderboards
                    </NextLink>
                </div>

                {/* Main Card */}
                <div className="glass-card p-8 md:p-12 relative overflow-hidden animate-slide-up">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Trophy size={160} className="text-white" />
                    </div>

                    <div className="text-center mb-12 relative z-10">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold-500/10 border-2 border-gold-500/30 mb-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                            <User size={40} className="text-gold-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-2 uppercase tracking-tighter">{participant.name}</h1>
                        <p className="text-turquoise-400 font-black tracking-[0.3em] uppercase mb-4 flex items-center justify-center gap-2 text-sm">
                            <Star size={14} className="text-gold-500" /> {group.name}
                        </p>
                        <div className="ornament-divider max-w-xs mx-auto my-6 opacity-30" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Points Column */}
                        <div className="md:col-span-1 rounded-3xl bg-turquoise-900/30 border border-turquoise-700/50 p-8 flex flex-col items-center justify-center text-center">
                            <h3 className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.3em] mb-4">Total Score</h3>
                            {score?.points !== null && score?.points !== undefined ? (
                                <div>
                                    <span className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        {score.points}
                                    </span>
                                    <div className="text-gold-500 font-bold mt-2 tracking-widest uppercase">/ 100 Points</div>
                                </div>
                            ) : (
                                <div className="text-turquoise-600/50 uppercase tracking-widest font-bold text-sm">--</div>
                            )}

                            {!score && (
                                <span className="mt-8 bg-turquoise-900/40 text-turquoise-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={14} /> Pending
                                </span>
                            )}
                        </div>

                        {/* Notes Column */}
                        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-8 relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-gold-500/10">
                                    <FileText size={20} className="text-gold-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Judge's Evaluation</h3>
                                    <p className="text-[10px] text-turquoise-500 font-black uppercase tracking-[0.2em]">Qualitative Notes</p>
                                </div>
                            </div>

                            {score?.notes ? (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-white/80 leading-loose font-medium text-lg italic border-l-4 border-gold-500/50 pl-6 py-2 bg-gradient-to-r from-gold-500/5 to-transparent">
                                        "{score.notes}"
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-turquoise-700 border-2 border-dashed border-turquoise-800/50 rounded-2xl">
                                    <FileText size={32} className="mb-4 opacity-50" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No notes recorded yet</p>
                                    <p className="text-sm mt-2 opacity-70">The judge has not submitted an evaluation for this participant.</p>
                                </div>
                            )}

                            {score && (
                                <div className="absolute top-6 right-6">
                                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <CheckCircle2 size={12} /> Evaluated
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
