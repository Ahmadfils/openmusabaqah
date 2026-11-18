import { BookOpen, Building2, Sparkles, Star, Trophy, Users } from 'lucide-react';
import SectionHeading from './SectionHeading';
import StatCounter from './StatCounter';
import type { CmsMilestoneItem, CmsStatItem, CmsTeamMemberItem, CmsTestimonialItem } from '@/lib/cms-types';

export function VisionSection({ milestones }: { milestones: CmsMilestoneItem[] }) {
    return (
        <section id="about" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                    <SectionHeading
                        eyebrow="Vision & milestones"
                        title="Built for fair, dignified Quran competitions"
                        description="We believe every reciter deserves transparent judging and every organizer deserves reliable tools. OpenMusabaqa replaces paper tallies and spreadsheets with one calm, auditable workflow."
                    />
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {[
                            ['Independent judging', 'Each judge submits from their own device. Scores are reconciled automatically.'],
                            ['Tenant isolation', 'Every organization owns its competitions, judges and participants.'],
                            ['Public trust', 'Verified organizations publish live leaderboards anyone can inspect.'],
                            ['Email communications', 'Verification, judge invitations and announcements in one place.'],
                        ].map(([title, text]) => (
                            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-bold text-white">{title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-turquoise-400">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <ol className="relative space-y-4 border-l border-gold-500/20 pl-6">
                    {milestones.map((milestone) => (
                        <li key={milestone.id} className="relative">
                            <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 rounded-full border-2 border-gold-500 bg-turquoise-950" />
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-gold-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-gold-300">{milestone.year}</span>
                                    <h3 className="font-bold text-white">{milestone.title}</h3>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-turquoise-300/80">{milestone.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

const statIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    trophy: Trophy,
    users: Users,
    book: BookOpen,
    building: Building2,
};

export function StatsSection({ stats }: { stats: CmsStatItem[] }) {
    return (
        <section className="border-y border-white/5 bg-white/[0.02]">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 px-5 py-12 md:grid-cols-4 md:px-8">
                {stats.map((stat) => {
                    const Icon = statIcons[stat.icon ?? ''] ?? Sparkles;
                    return (
                        <div key={stat.id} className="text-center">
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/10 text-gold-300">
                                <Icon size={20} />
                            </span>
                            <p className="mt-3 text-3xl font-black text-white md:text-4xl">
                                <StatCounter value={stat.value} suffix={stat.suffix} />
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-turquoise-500">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function TestimonialsSection({ testimonials }: { testimonials: CmsTestimonialItem[] }) {
    return (
        <section id="stories" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <SectionHeading
                eyebrow="Testimonies"
                title="Trusted on and off the stage"
                description="Judges, organizers and reciters describe what changes when the process is transparent."
                center
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
                {testimonials.map((testimonial) => (
                    <figure key={testimonial.id} className="glass-card flex h-full flex-col p-6">
                        <div className="flex items-center gap-1 text-gold-400">
                            {Array.from({ length: Math.max(1, testimonial.rating) }).map((_, index) => (
                                <Star key={index} size={14} fill="currentColor" />
                            ))}
                        </div>
                        <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-turquoise-100/90">“{testimonial.quote}”</blockquote>
                        <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-turquoise-600 to-gold-600 text-sm font-black text-white">
                                {initials(testimonial.name)}
                            </span>
                            <span>
                                <span className="block text-sm font-bold text-white">{testimonial.name}</span>
                                <span className="block text-[11px] text-turquoise-400">{testimonial.role}</span>
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}

export function TeamSection({ team }: { team: CmsTeamMemberItem[] }) {
    return (
        <section id="team" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <SectionHeading
                eyebrow="The team"
                title="Three founders, one mission"
                description="A small team with deep roots in Quran education, software engineering and competition operations."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
                {team.map((member) => (
                    <article key={member.id} className="glass-card flex h-full flex-col p-6">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-turquoise-600 to-gold-600 text-xl font-black text-white">
                            {initials(member.name)}
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-white">{member.name}</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">{member.role}</p>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-turquoise-300/80">{member.bio}</p>
                        {(member.twitter || member.linkedin) && (
                            <div className="mt-4 flex gap-3 text-xs">
                                {member.twitter && (
                                    <a href={member.twitter} target="_blank" rel="noreferrer" className="text-turquoise-300 hover:text-gold-300">
                                        Twitter / X
                                    </a>
                                )}
                                {member.linkedin && (
                                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="text-turquoise-300 hover:text-gold-300">
                                        LinkedIn
                                    </a>
                                )}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}
