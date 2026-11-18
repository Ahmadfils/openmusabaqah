import Link from 'next/link';
import { ArrowRight, Radio, Star, Trophy, Users } from 'lucide-react';
import HeroShowcase from './HeroShowcase';
import type { CmsHeroContent } from '@/lib/cms-types';

export default function Hero({ hero }: { hero: CmsHeroContent }) {
    return (
        <section id="top" className="relative overflow-hidden">
            <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-turquoise-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

            <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
                <div className="animate-slide-up">
                    <p className="inline-flex items-center gap-2 rounded-full border border-turquoise-500/30 bg-turquoise-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-turquoise-200">
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

                <HeroShowcase />
            </div>
        </section>
    );
}
