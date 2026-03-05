'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const portals = [
    {
        href: '/participant',
        label: 'Participants',
        labelAr: 'المشاركون',
        icon: (
            <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                <circle cx="32" cy="20" r="12" stroke="#fbbf24" strokeWidth="3" fill="rgba(251,191,36,0.1)" />
                <path d="M12 52c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="48" cy="18" r="8" stroke="#14b8a6" strokeWidth="2" fill="rgba(20,184,166,0.1)" />
                <path d="M56 38c0-6.627-3.582-12-8-12" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
        ),
        description: 'Select your question number',
        color: 'from-turquoise-600/20 to-turquoise-800/20',
        border: 'border-turquoise-500/40',
        glow: 'hover:shadow-turquoise-500/25',
        tag: 'bg-turquoise-500',
    },
    {
        href: '/judge',
        label: 'Judge',
        labelAr: 'الحكم',
        icon: (
            <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                <rect x="10" y="14" width="44" height="36" rx="4" stroke="#f59e0b" strokeWidth="3" fill="rgba(245,158,11,0.1)" />
                <line x1="20" y1="26" x2="44" y2="26" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="34" x2="38" y2="34" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="42" x2="32" y2="42" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="52" cy="48" r="10" fill="#042f2e" stroke="#14b8a6" strokeWidth="2" />
                <path d="M48 48l2.5 2.5L56 45" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        description: 'View questions & score participants',
        color: 'from-gold-600/20 to-gold-800/20',
        border: 'border-gold-500/40',
        glow: 'hover:shadow-gold-500/25',
        tag: 'bg-gold-500',
    },
    {
        href: '/results',
        label: 'Results',
        labelAr: 'النتائج',
        icon: (
            <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                <rect x="8" y="40" width="12" height="16" rx="2" fill="rgba(20,184,166,0.15)" stroke="#14b8a6" strokeWidth="2" />
                <rect x="26" y="28" width="12" height="28" rx="2" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2.5" />
                <rect x="44" y="16" width="12" height="40" rx="2" fill="rgba(20,184,166,0.15)" stroke="#14b8a6" strokeWidth="2" />
                <path d="M12 32l14-12 14 8 12-18" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="32" r="3" fill="#fbbf24" />
                <circle cx="26" cy="20" r="3" fill="#fbbf24" />
                <circle cx="40" cy="28" r="3" fill="#fbbf24" />
                <circle cx="52" cy="10" r="3" fill="#fbbf24" />
            </svg>
        ),
        description: 'Live leaderboard & standings',
        color: 'from-turquoise-700/20 to-gold-700/20',
        border: 'border-gold-400/30',
        glow: 'hover:shadow-gold-400/20',
        tag: 'bg-gradient-to-r from-turquoise-500 to-gold-500',
    },
];

export default function HomePage() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString('en-GB'));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-6 md:p-10">
            {/* Header */}
            <header className="w-full max-w-5xl flex items-center justify-between animate-fade-in relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-turquoise-500 to-gold-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">م</span>
                    </div>
                    <div>
                        <p className="text-turquoise-300 text-xs font-medium uppercase tracking-widest leading-none">OpenMusabaqah</p>
                        <p className="text-gold-400/70 text-[10px] font-arabic mt-1">مسابقة القرآن الكريم</p>
                    </div>
                </div>

                {/* Bismillah Calligraphy */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 hidden md:block">
                    <p className="font-arabic text-3xl text-gold-500/40 select-none">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/admin" className="text-[10px] uppercase tracking-widest text-turquoise-700 hover:text-turquoise-400 transition-colors bg-turquoise-900/20 px-2 py-1 rounded border border-turquoise-800/30">
                        Admin
                    </Link>
                    <div className="text-right">
                        <p className="text-turquoise-300 font-mono text-lg font-semibold leading-none">{time}</p>
                        <p className="text-turquoise-600 text-[10px] mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>
            </header>

            {/* Ornament */}
            <div className="ornament-divider w-full max-w-5xl" />

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center gap-6 py-10 animate-slide-up text-center">
                {/* Quran Icon */}
                <div className="relative mb-2">
                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-turquoise-600/30 to-gold-600/30 border border-gold-500/30 flex items-center justify-center shadow-2xl backdrop-blur-sm animate-pulse-gold">
                        <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
                            <rect x="12" y="8" width="56" height="64" rx="6" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="2" />
                            <rect x="8" y="10" width="52" height="64" rx="6" fill="rgba(20,184,166,0.08)" stroke="#14b8a6" strokeWidth="1.5" />
                            <line x1="20" y1="26" x2="52" y2="26" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="20" y1="34" x2="52" y2="34" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="20" y1="42" x2="44" y2="42" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M34 56l4-8 4 8" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="38" cy="52" r="6" stroke="#14b8a6" strokeWidth="1.5" fill="none" />
                        </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center shadow-lg">
                        <span className="text-xs text-gray-900 font-bold">✦</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-2">
                        <span className="gold-text">Open</span>
                        <span className="text-white">Musabaqah</span>
                    </h1>
                    <p className="font-arabic text-2xl text-gold-400/80 mt-1">مسابقة القرآن الكريم</p>
                    <p className="text-turquoise-300/70 text-lg mt-3 max-w-md">
                        A real-time Quran competition platform for participants, judges, and audiences
                    </p>
                </div>

                {/* Portal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
                    {portals.map((portal, i) => (
                        <Link key={portal.href} href={portal.href}
                            id={`portal-${portal.label.toLowerCase()}`}
                            className={`group relative glass-card p-8 flex flex-col items-center gap-4 text-center
                         bg-gradient-to-br ${portal.color} border ${portal.border}
                         transition-all duration-300 hover:scale-105 hover:shadow-2xl ${portal.glow}
                         animate-slide-up`}
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            {/* Portal number badge */}
                            <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="text-xs text-turquoise-300 font-mono">{String(i + 1).padStart(2, '0')}</span>
                            </div>

                            {/* Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent blur-xl" />
                                {portal.icon}
                            </div>

                            {/* Labels */}
                            <div>
                                <h2 className="text-2xl font-bold text-white group-hover:text-gold-300 transition-colors">{portal.label}</h2>
                                <p className="font-arabic text-gold-400/60 text-sm mt-0.5">{portal.labelAr}</p>
                            </div>
                            <p className="text-sm text-turquoise-300/70 group-hover:text-turquoise-200/90 transition-colors">{portal.description}</p>

                            {/* Enter arrow */}
                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-turquoise-400 group-hover:text-gold-400 transition-colors">
                                <span>Enter</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full max-w-5xl text-center">
                <div className="ornament-divider mb-4" />
                <p className="text-turquoise-700 text-xs">
                    OpenMusabaqah • Quran Competition Platform •{' '}
                    <span className="font-arabic text-gold-600">بسم الله الرحمن الرحيم</span>
                </p>
            </footer>
        </main>
    );
}
