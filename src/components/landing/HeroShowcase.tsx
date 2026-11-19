'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { Gavel, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';

const slides = [
    { src: '/gallery/Capture-musabaq-1.PNG', alt: 'OpenMusabaqa platform preview 1' },
    { src: '/gallery/Capture-musabaq-2.PNG', alt: 'OpenMusabaqa platform preview 2' },
    { src: '/gallery/Capture-musabaq-4.PNG', alt: 'OpenMusabaqa platform preview 3' },
];

export default function HeroShowcase() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % slides.length);
        }, 4200);
        return () => window.clearInterval(timer);
    }, [paused]);

    return (
        <div
            className="relative animate-slide-up"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="pointer-events-none absolute -left-10 -top-8 h-40 w-40 rounded-full bg-turquoise-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-gold-500/20 blur-3xl" />

            <div className="pointer-events-none absolute -left-5 top-20 z-20 hidden h-12 w-12 animate-float items-center justify-center rounded-2xl border border-gold-500/40 bg-[#042f2e]/90 text-gold-300 shadow-lg shadow-black/30 backdrop-blur sm:flex">
                <Trophy size={20} />
            </div>
            <div
                className="pointer-events-none absolute -right-4 top-10 z-20 hidden h-12 w-12 animate-float items-center justify-center rounded-2xl border border-emerald-500/40 bg-[#042f2e]/90 text-emerald-300 shadow-lg shadow-black/30 backdrop-blur sm:flex"
                style={{ animationDelay: '1.2s' }}
            >
                <ShieldCheck size={20} />
            </div>
            <div
                className="pointer-events-none absolute -left-4 bottom-20 z-20 hidden h-12 w-12 animate-float items-center justify-center rounded-2xl border border-turquoise-500/40 bg-[#042f2e]/90 text-turquoise-200 shadow-lg shadow-black/30 backdrop-blur sm:flex"
                style={{ animationDelay: '2.1s' }}
            >
                <Gavel size={20} />
            </div>
            <div
                className="pointer-events-none absolute -right-5 bottom-10 z-20 hidden h-12 w-12 animate-float items-center justify-center rounded-2xl border border-gold-500/40 bg-[#042f2e]/90 text-gold-300 shadow-lg shadow-black/30 backdrop-blur sm:flex"
                style={{ animationDelay: '0.6s' }}
            >
                <Users size={20} />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-turquoise-500/25 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-md">
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#032624]/90 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gold-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.24em] text-turquoise-500">Platform preview</span>
                </div>

                <div className="relative aspect-[1366/604] bg-[#021a18]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-[#021a18]/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur">
                            <ShieldCheck size={11} /> Verified
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-[#021a18]/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-gold-200 backdrop-blur">
                            <Sparkles size={11} /> Live suite
                        </span>
                    </div>
                    {slides.map((slide, index) => (
                        <img
                            key={slide.src}
                            src={slide.src}
                            alt={slide.alt}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 ease-out ${
                                index === active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
                {slides.map((slide, index) => (
                    <button
                        key={slide.src}
                        type="button"
                        aria-label={`Show preview ${index + 1}`}
                        aria-pressed={index === active}
                        onClick={() => setActive(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            index === active ? 'w-8 bg-gold-400' : 'w-2 bg-turquoise-600 hover:bg-turquoise-400'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
