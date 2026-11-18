import Link from 'next/link';
import { ArrowRight, Building2, Gavel, Radio, Star, Trophy, Users } from 'lucide-react';
import type { CmsHeroContent } from '@/lib/cms-types';

const portals = [
    {
        href: '/results',
        title: 'Participant & public portal',
        description: 'Discover competitions, register and follow live leaderboards.',
        icon: Trophy,
        tone: 'text-gold-300 border-gold-500/30 bg-gold-500/10',
    },
    {
        href: '/login',
        title: 'Judge portal',
        description: 'Score reciters independently from any device.',
        icon: Gavel,
        tone: 'text-turquoise-200 border-turquoise-500/30 bg-turquoise-500/10',
    },
    {
        href: '/signup',
        title: 'Organizer workspace',
        description: 'Create a tenant, invite judges and run your competition.',
        icon: Building2,
        tone: 'text-gold-300 border-gold-500/30 bg-gold-500/10',
    },
];

export default function Hero({ hero }: { hero: CmsHeroContent }) {
    return (
        <section id="top" className="relative overflow-hidden">
            <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-turquoise-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

            <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
                <div className="animate-slide-up">
                    {hero.badge && (
                        <p className="font-arabic text-2xl text-gold-400/90 md:text-3xl" style={{ fontFamily: 'Amiri, serif' }}>
                            {hero.badge}
                        </p>
                    )}
                    <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-turquoise-500/30 bg-turquoise-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-turquoise-200">
                        <Star size={12} /> Multi-organization Quran competitions
                    </p>
                    <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
                        {hero.title.split(' ').slice(0, 3).join(' ')}{' '}
                        <span className="gold-text">{hero.title.split(' ').slice(3).join(' ')}</span>
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-turquoise-300/80 md:text-lg">{hero.subtitle}</p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link href={hero.primaryLink} className="btn-gold flex items-center gap-2 px-6 py-3 text-sm">
                            {hero.primaryCta} <ArrowRight size={16} />
                        </Link>
                        {hero.secondaryCta && hero.secondaryLink && (
                            <Link
                                href={hero.secondaryLink}
                                className="flex items-center gap-2 rounded-xl border border-turquoise-500/40 bg-white/5 px-6 py-3 text-sm font-semibold text-turquoise-200 transition-colors hover:bg-turquoise-500/10"
                            >
                                {hero.secondaryCta}
                            </Link>
                        )}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-turquoise-500">
                        <span className="flex items-center gap-2"><Users size={14} /> Independent judge scoring</span>
                        <span className="flex items-center gap-2"><Radio size={14} /> Live stage control</span>
                        <span className="flex items-center gap-2"><Trophy size={14} /> Verified leaderboards</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 lg:pt-6">
                    {portals.map((portal, index) => {
                        const Icon = portal.icon;
                        return (
                            <Link
                                key={portal.href}
                                href={portal.href}
                                className="group glass-card flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40"
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${portal.tone}`}>
                                    <Icon size={22} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-bold text-white transition-colors group-hover:text-gold-300">{portal.title}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-turquoise-400">{portal.description}</span>
                                </span>
                                <ArrowRight size={16} className="shrink-0 text-turquoise-600 transition-all group-hover:translate-x-1 group-hover:text-gold-300" />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
