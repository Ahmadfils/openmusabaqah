/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail } from 'lucide-react';

const socialLinks = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', Icon: Linkedin },
    { label: 'Facebook', href: 'https://www.facebook.com/', Icon: Facebook },
    { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
    { label: 'Instagram', href: 'https://www.instagram.com/', Icon: Instagram },
];

function TikTokIcon({ size = 16 }: { size?: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.85.13V9.4a6.33 6.33 0 0 0-.85-.05A6.34 6.34 0 0 0 5.1 20.1a6.34 6.34 0 0 0 10.86-4.43V8.01a8.16 8.16 0 0 0 4.77 1.52V6.1a4.85 4.85 0 0 1-1.14.59z" />
        </svg>
    );
}

export default function LandingFooter() {
    return (
        <footer className="border-t border-white/10 bg-[#021f1e]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 md:px-8">
                <div className="flex flex-col justify-between gap-8 md:flex-row">
                    <div className="max-w-sm">
                        <div className="flex items-center gap-3">
                            <img src="/icons/openMusabaqa-logo.svg" alt="OpenMusabaqa logo" className="h-9 w-9 rounded-xl" />
                            <span className="text-sm font-black uppercase tracking-[0.18em] text-white">OpenMusabaqa</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-turquoise-400">
                            A multi-organization platform for Quran competitions: independent judging, live stages, public registration and
                            verified leaderboards.
                        </p>
                        <div className="mt-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Follow us</p>
                            <div className="mt-2 flex items-center gap-2">
                                {socialLinks.map(({ label, href, Icon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`OpenMusabaqa on ${label}`}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-turquoise-300 transition-colors hover:border-gold-500/40 hover:text-gold-300"
                                    >
                                        <Icon size={16} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Platform</p>
                            <ul className="mt-3 space-y-2 text-turquoise-300">
                                <li><Link href="/results" className="hover:text-gold-300">Competitions</Link></li>
                                <li><a href="#leaderboards" className="hover:text-gold-300">Leaderboards</a></li>
                                <li><a href="#newsletter" className="hover:text-gold-300">Newsletter</a></li>
                                <li><Link href="/unsubscribe" className="hover:text-gold-300">Unsubscribe</Link></li>
                                <li><a href="#gallery" className="hover:text-gold-300">Gallery</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">Organizations</p>
                            <ul className="mt-3 space-y-2 text-turquoise-300">
                                <li><Link href="/signup" className="hover:text-gold-300">Start Musabaqa</Link></li>
                                <li><Link href="/login" className="hover:text-gold-300">Sign in</Link></li>
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
                    <p>Built for fair, dignified Quran competitions.</p>
                </div>
            </div>
        </footer>
    );
}
