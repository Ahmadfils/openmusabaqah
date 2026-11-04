'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Building2, CalendarDays, Trophy, Users } from 'lucide-react';

const portals = [
    {
        href: '/results',
        title: 'Public competitions',
        subtitle: 'المسابقات العامة',
        description: 'Browse live leaderboards, register for a competition, or follow the stage.',
        icon: <Trophy size={30} className="text-gold-400" />,
        accent: 'border-gold-500/40 hover:shadow-gold-500/20',
    },
    {
        href: '/login',
        title: 'Judge portal',
        subtitle: 'بوابة الحكام',
        description: 'Sign in to score participants independently with your organization.',
        icon: <Users size={30} className="text-turquoise-300" />,
        accent: 'border-turquoise-500/40 hover:shadow-turquoise-500/20',
    },
    {
        href: '/signup',
        title: 'Organize a competition',
        subtitle: 'نظّم مسابقتك',
        description: 'Create your organization, invite judges, and manage registrations.',
        icon: <Building2 size={30} className="text-gold-400" />,
        accent: 'border-gold-400/30 hover:shadow-gold-400/20',
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
        <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-10">
            <header className="relative flex w-full max-w-5xl animate-fade-in items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turquoise-500 to-gold-500 shadow-lg">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase leading-none tracking-widest text-turquoise-300">OpenMusabaqah</p>
                        <p className="mt-1 text-[10px] text-gold-400/70">مسابقة القرآن الكريم</p>
                    </div>
                </div>

                <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
                    <p className="select-none text-3xl text-gold-500/40" style={{ fontFamily: 'Amiri, serif' }}>
                        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        href="/login"
                        className="rounded border border-turquoise-800/30 bg-turquoise-900/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-turquoise-300 transition-colors hover:text-gold-300"
                    >
                        Sign in
                    </Link>
                    <div className="text-right">
                        <p className="font-mono text-lg font-semibold leading-none text-turquoise-300">{time}</p>
                        <p className="mt-1 text-[10px] text-turquoise-600">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>
            </header>

            <div className="ornament-divider w-full max-w-5xl" />

            <section className="flex flex-1 animate-slide-up flex-col items-center justify-center gap-8 py-10 text-center">
                <div className="relative">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-gold-500/30 bg-gradient-to-br from-turquoise-600/30 to-gold-600/30 shadow-2xl backdrop-blur-sm">
                        <BookOpen size={52} className="text-gold-400" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 shadow-lg">
                        <span className="text-xs font-bold text-gray-900">✦</span>
                    </div>
                </div>

                <div>
                    <h1 className="mb-2 text-5xl font-bold md:text-6xl">
                        <span className="gold-text">Open</span>
                        <span className="text-white">Musabaqah</span>
                    </h1>
                    <p className="mt-1 text-2xl text-gold-400/80" style={{ fontFamily: 'Amiri, serif' }}>
                        مسابقة القرآن الكريم
                    </p>
                    <p className="mx-auto mt-3 max-w-xl text-lg text-turquoise-300/70">
                        Multi-organization Quran competition platform with independent judging, live leaderboards, and public
                        registration.
                    </p>
                </div>

                <div className="grid w-full max-w-5xl gap-5 md:grid-cols-3">
                    {portals.map((portal, index) => (
                        <Link
                            key={portal.href}
                            href={portal.href}
                            className={`group relative flex flex-col items-center gap-4 rounded-2xl border bg-white/5 p-8 text-center backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl ${portal.accent} animate-slide-up`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <span className="font-mono text-xs text-turquoise-300">{String(index + 1).padStart(2, '0')}</span>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">{portal.icon}</div>
                            <div>
                                <h2 className="text-xl font-bold text-white transition-colors group-hover:text-gold-300">{portal.title}</h2>
                                <p className="mt-0.5 text-sm text-gold-400/60" style={{ fontFamily: 'Amiri, serif' }}>
                                    {portal.subtitle}
                                </p>
                            </div>
                            <p className="text-sm text-turquoise-300/70 transition-colors group-hover:text-turquoise-200/90">
                                {portal.description}
                            </p>
                            <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-turquoise-400 transition-colors group-hover:text-gold-400">
                                Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-turquoise-500">
                    <span className="flex items-center gap-2">
                        <CalendarDays size={14} /> Real-time stage updates
                    </span>
                    <span className="flex items-center gap-2">
                        <Users size={14} /> Independent judge scoring
                    </span>
                    <span className="flex items-center gap-2">
                        <Trophy size={14} /> Public, private, or hidden points
                    </span>
                </div>
            </section>

            <footer className="w-full max-w-5xl text-center">
                <div className="ornament-divider mb-4" />
                <p className="text-xs text-turquoise-700">
                    OpenMusabaqah • Quran Competition Platform •{' '}
                    <span className="text-gold-600" style={{ fontFamily: 'Amiri, serif' }}>
                        بسم الله الرحمن الرحيم
                    </span>
                </p>
            </footer>
        </main>
    );
}
