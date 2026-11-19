import Link from 'next/link';
import { ArrowRight, CalendarDays, Lock, Medal, Radio, Trophy, UserPlus, Users } from 'lucide-react';
import SectionHeading from './SectionHeading';
import type { LeaderboardPreview, PublicCompetitionCard } from '@/lib/landing-data';

const statusStyles: Record<string, string> = {
    ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    COMPLETED: 'border-turquoise-500/30 bg-turquoise-500/10 text-turquoise-200',
    DRAFT: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    ARCHIVED: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

export function CompetitionsSection({ competitions }: { competitions: PublicCompetitionCard[] }) {
    return (
        <section id="competitions" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                    eyebrow="Public competitions"
                    title="Find a competition to follow or join"
                    description="Only competitions published by verified organizations appear here. Registration opens per organizer."
                />
                <Link href="/results" className="flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300">
                    Browse all <ArrowRight size={15} />
                </Link>
            </div>

            {competitions.length === 0 ? (
                <div className="glass-card mt-10 p-10 text-center">
                    <Trophy size={40} className="mx-auto text-turquoise-700" />
                    <p className="mt-4 font-bold text-white">No public competitions yet</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-turquoise-400">
                        Organizations are onboarding now. Register your organization to host the first competition in your community.
                    </p>
                    <Link href="/signup" className="btn-gold mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                        <UserPlus size={15} /> Start Musabaqa
                    </Link>
                </div>
            ) : (
                <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {competitions.map((competition) => {
                        const pointsHidden = competition.leaderboardVisibility === 'HIDDEN_POINTS';
                        return (
                            <article key={competition.id} className="glass-card flex h-full flex-col p-6">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-turquoise-500">{competition.organizationName}</p>
                                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyles[competition.status] ?? statusStyles.DRAFT}`}>
                                        {competition.status.toLowerCase()}
                                    </span>
                                </div>
                                <h3 className="mt-2 text-xl font-bold text-white">{competition.name}</h3>
                                {competition.description && <p className="mt-2 line-clamp-3 text-sm text-turquoise-300/80">{competition.description}</p>}

                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-turquoise-500">
                                    <span className="flex items-center gap-1.5"><Users size={12} /> {competition.participants} participants</span>
                                    <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {competition.groups} groups</span>
                                    {pointsHidden && <span className="flex items-center gap-1.5 text-gold-500"><Lock size={12} /> points hidden</span>}
                                </div>

                                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                                    <Link href={`/leaderboard/${competition.slug}`} className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs">
                                        <Trophy size={13} /> Leaderboard
                                    </Link>
                                    {competition.publicLiveStage && (
                                        <Link
                                            href={`/live/${competition.slug}`}
                                            className="flex items-center gap-1.5 rounded-xl border border-turquoise-500/40 bg-turquoise-500/10 px-4 py-2 text-xs font-semibold text-turquoise-200 hover:bg-turquoise-500/20"
                                        >
                                            <Radio size={13} /> Live stage
                                        </Link>
                                    )}
                                    {competition.publicRegistration && competition.registrationOpen && (
                                        <Link
                                            href={`/register/${competition.slug}`}
                                            className="flex items-center gap-1.5 rounded-xl border border-gold-500/30 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
                                        >
                                            <UserPlus size={13} /> Register
                                        </Link>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

const medalStyles = ['text-gold-300 border-gold-500/40 bg-gold-500/10', 'text-slate-200 border-slate-400/30 bg-slate-400/10', 'text-amber-600 border-amber-700/40 bg-amber-700/10'];

export function LeaderboardsSection({ previews }: { previews: LeaderboardPreview[] }) {
    return (
        <section id="leaderboards" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <SectionHeading
                eyebrow="Public leaderboards"
                title="Verified scores, visible to everyone"
                description="These rankings are computed from independent judge submissions and update as the competition progresses."
            />

            {previews.length === 0 ? (
                <div className="glass-card mt-10 p-10 text-center text-sm text-turquoise-400">
                    Public leaderboards will appear here as soon as a verified organization publishes its first public results.
                </div>
            ) : (
                <div className="mt-10 grid gap-5 lg:grid-cols-3">
                    {previews.map((preview) => (
                        <article key={preview.id} className="glass-card flex h-full flex-col p-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-turquoise-500">{preview.organizationName}</p>
                            <h3 className="mt-1 text-lg font-bold text-white">{preview.name}</h3>

                            {preview.rows.length === 0 ? (
                                <p className=" mt-5 flex-1 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-turquoise-500">
                                    No completed recitations yet. Judging is in progress.
                                </p>
                            ) : (
                                <ol className="mt-5 flex-1 space-y-2">
                                    {preview.rows.map((row) => (
                                        <li key={row.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${medalStyles[(row.rank ?? 1) - 1] ?? medalStyles[2]}`}>
                                                {row.rank}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-white">{row.name}</span>
                                                <span className="block text-[10px] text-turquoise-500">{row.groupName ?? 'Unassigned'}</span>
                                            </span>
                                            <span className="font-mono text-sm font-bold text-gold-300">{row.average?.toFixed(1)}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}

                            <Link href={`/leaderboard/${preview.slug}`} className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300">
                                <Medal size={13} /> Open full leaderboard <ArrowRight size={12} />
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
