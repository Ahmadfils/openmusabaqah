import Link from 'next/link';
import { BookOpen, Mail } from 'lucide-react';

export default function LandingFooter() {
    return (
        <footer className="border-t border-white/10 bg-[#021f1e]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 md:px-8">
                <div className="flex flex-col justify-between gap-8 md:flex-row">
                    <div className="max-w-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-turquoise-500 to-gold-500">
                                <BookOpen size={17} className="text-white" />
                            </span>
                            <span className="text-sm font-black uppercase tracking-[0.18em] text-white">OpenMusabaqa</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-turquoise-400">
                            A multi-organization platform for Quran competitions: independent judging, live stages, public registration and
                            verified leaderboards.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Platform</p>
                            <ul className="mt-3 space-y-2 text-turquoise-300">
                                <li><Link href="/results" className="hover:text-gold-300">Competitions</Link></li>
                                <li><a href="#leaderboards" className="hover:text-gold-300">Leaderboards</a></li>
                                <li><a href="#newsletter" className="hover:text-gold-300">Newsletter</a></li>
                                <li><a href="#gallery" className="hover:text-gold-300">Gallery</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Organizations</p>
                            <ul className="mt-3 space-y-2 text-turquoise-300">
                                <li><Link href="/signup" className="hover:text-gold-300">Register</Link></li>
                                <li><Link href="/login" className="hover:text-gold-300">Sign in</Link></li>
                                <li><Link href="/admin" className="hover:text-gold-300">Admin console</Link></li>
                                <li><Link href="/superadmin" className="hover:text-gold-300">Platform console</Link></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Contact</p>
                            <ul className="mt-3 space-y-2 text-turquoise-300">
                                <li>
                                    <a href="mailto:partners@openmusabaqa.org" className="flex items-center gap-1.5 hover:text-gold-300">
                                        <Mail size={12} /> Partners
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:support@openmusabaqa.org" className="flex items-center gap-1.5 hover:text-gold-300">
                                        <Mail size={12} /> Support
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-turquoise-600 sm:flex-row">
                    <p>© {new Date().getFullYear()} OpenMusabaqa. All rights reserved.</p>
                    <p className="font-arabic text-gold-600" style={{ fontFamily: 'Amiri, serif' }}>
                        بسم الله الرحمن الرحيم
                    </p>
                </div>
            </div>
        </footer>
    );
}
