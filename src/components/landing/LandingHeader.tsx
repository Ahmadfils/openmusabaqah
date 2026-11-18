import Link from 'next/link';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

const links = [
    { href: '#about', label: 'Vision' },
    { href: '#competitions', label: 'Competitions' },
    { href: '#leaderboards', label: 'Leaderboards' },
    { href: '#team', label: 'Team' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#partners', label: 'Partners' },
];

export default function LandingHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-turquoise-800/30 bg-[#042f2e]/85 backdrop-blur-lg">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turquoise-500 to-gold-500 shadow-lg">
                        <BookOpen size={20} className="text-white" />
                    </span>
                    <span>
                        <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">OpenMusabaqa</span>
                        <span className="block font-arabic text-[11px] text-gold-400/80">مسابقة القرآن الكريم</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-6 lg:flex">
                    {links.map((link) => (
                        <a key={link.href} href={link.href} className="text-sm text-turquoise-300 transition-colors hover:text-gold-300">
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-turquoise-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <LogIn size={13} /> <span className="hidden sm:inline">Sign in</span>
                    </Link>
                    <Link href="/signup" className="btn-gold flex items-center gap-1.5 px-3 py-2 text-xs">
                        <UserPlus size={13} /> <span className="hidden sm:inline">Register organization</span>
                        <span className="sm:hidden">Register</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
