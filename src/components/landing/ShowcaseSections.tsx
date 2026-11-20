/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowRight, Camera, ExternalLink, Handshake, ImageIcon } from 'lucide-react';
import SectionHeading from './SectionHeading';
import type { CmsCtaContent, CmsGalleryItem, CmsPartnerItem } from '@/lib/cms-types';

export function GallerySection({ items }: { items: CmsGalleryItem[] }) {
    return (
        <section id="gallery" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                    eyebrow="Gallery"
                    title="Moments from the competition floor"
                    description="Ceremonies, judging rooms, live stages and the people who make each musabaqa memorable."
                />
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-turquoise-500">
                    <Camera size={14} /> Curated by the community
                </span>
            </div>

            <div className="mt-10 grid auto-rows-[180px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => (
                    <figure
                        key={item.id}
                        className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${
                            item.featured ? 'sm:col-span-2 lg:row-span-2' : ''
                        }`}
                    >
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-turquoise-700">
                                <ImageIcon size={32} />
                            </span>
                        )}
                    </figure>
                ))}
            </div>
        </section>
    );
}

const tierStyles: Record<string, string> = {
    gold: 'border-gold-500/40 bg-gold-500/[0.07] text-gold-200',
    silver: 'border-slate-400/30 bg-slate-400/[0.06] text-slate-200',
    partner: 'border-turquoise-500/30 bg-turquoise-500/[0.06] text-turquoise-200',
};

export function PartnersSection({ partners }: { partners: CmsPartnerItem[] }) {
    return (
        <section id="partners" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <SectionHeading
                eyebrow="Partners & sponsors"
                title="Institutions standing behind the platform"
                description="Mosques, academies, universities and media partners who help competitions reach more reciters."
                center
            />
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                {partners.map((partner) => {
                    const content = (
                        <>
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-black">
                                {partner.logoUrl ? (
                                    <img src={partner.logoUrl} alt={`${partner.name} logo`} className="h-9 w-9 object-contain" />
                                ) : (
                                    partner.name.slice(0, 2).toUpperCase()
                                )}
                            </span>
                            <span className="mt-3 block text-sm font-bold text-white">{partner.name}</span>
                            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">{partner.tier}</span>
                        </>
                    );

                    const className = `flex flex-col items-center rounded-2xl border p-5 text-center transition-transform hover:-translate-y-0.5 ${
                        tierStyles[partner.tier] ?? tierStyles.partner
                    }`;

                    return partner.website ? (
                        <a key={partner.id} href={partner.website} target="_blank" rel="noreferrer" className={className}>
                            {content}
                            <span className="mt-2 inline-flex items-center gap-1 text-[10px] opacity-70">
                                Visit <ExternalLink size={10} />
                            </span>
                        </a>
                    ) : (
                        <div key={partner.id} className={className}>
                            {content}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function CtaSection({ cta }: { cta: CmsCtaContent }) {
    return (
        <section id="sponsors" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="relative overflow-hidden rounded-3xl border border-gold-500/25 bg-gradient-to-br from-turquoise-900/80 via-[#053b38] to-[#1c1917] p-8 md:p-12">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-turquoise-500/10 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                    <div>
                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-gold-400">
                            <Handshake size={14} /> Call to action
                        </p>
                        <h2 className="mt-3 max-w-2xl text-3xl font-black text-white md:text-4xl">{cta.title}</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-turquoise-200/80">{cta.description}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href={cta.primaryLink} className="btn-gold flex items-center justify-center gap-2 px-6 py-3 text-sm">
                            {cta.primaryCta} <ArrowRight size={16} />
                        </Link>
                        {cta.secondaryCta && cta.secondaryLink && (
                            <Link
                                href={cta.secondaryLink}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                            >
                                {cta.secondaryCta}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
