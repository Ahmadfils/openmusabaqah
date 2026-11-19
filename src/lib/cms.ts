import 'server-only';

import { prisma } from '@/lib/prisma';
import { CMS_SECTIONS } from '@/lib/cms-types';
import type {
    CmsCtaContent,
    CmsGalleryItem,
    CmsHeroContent,
    CmsMilestoneItem,
    CmsPartnerItem,
    CmsStatItem,
    CmsTeamMemberItem,
    CmsTestimonialItem,
    LandingContent,
} from '@/lib/cms-types';

const DEFAULT_HERO: CmsHeroContent = {
    badge: null,
    title: 'Where Quran competitions meet modern technology',
    subtitle:
        'OpenMusabaqa gives organizations a complete workspace for independent judging, live stages, public registration and trustworthy leaderboards.',
    primaryCta: 'Start Musabaqa',
    primaryLink: '/signup',
    secondaryCta: null,
    secondaryLink: null,
    imageUrl: null,
    whatsappUrl: null,
};

const DEFAULT_CTA: CmsCtaContent = {
    title: 'Partner with the next generation of Quran competitions',
    description:
        'Sponsor a milestone, bring your institution on board, or co-host a competition. We work with mosques, academies, universities and foundations worldwide.',
    primaryCta: 'Become a partner',
    primaryLink: '/signup',
    secondaryCta: 'Talk to the team',
    secondaryLink: 'mailto:partners@openmusabaqa.org',
};

const DEFAULT_MILESTONES: CmsMilestoneItem[] = [
    { id: 'default-milestone-1', year: '2023', title: 'The first musabaqa', description: 'A single-venue competition proved that independent digital judging could be faster and fairer.', order: 1 },
    { id: 'default-milestone-2', year: '2024', title: 'Multi-organization platform', description: 'Organizations gained isolated workspaces with their own judges, groups and leaderboards.', order: 2 },
    { id: 'default-milestone-3', year: '2025', title: 'Live stages & public portals', description: 'Real-time stage control, public registration and shareable leaderboards arrived.', order: 3 },
    { id: 'default-milestone-4', year: '2026', title: 'A global community', description: 'Verified organizations, multilingual landing experiences and bulk communication tools.', order: 4 },
];

const DEFAULT_STATS: CmsStatItem[] = [
    { id: 'default-stat-1', label: 'Competitions hosted', value: '120', suffix: '+', icon: 'trophy', order: 1 },
    { id: 'default-stat-2', label: 'Participating reciters', value: '4,800', suffix: '+', icon: 'users', order: 2 },
    { id: 'default-stat-3', label: 'Questions recited', value: '18,000', suffix: '+', icon: 'book', order: 3 },
    { id: 'default-stat-4', label: 'Registered organizations', value: '35', suffix: '', icon: 'building', order: 4 },
];

const DEFAULT_TESTIMONIALS: CmsTestimonialItem[] = [
    {
        id: 'default-testimonial-1',
        name: 'Dr. Amina Rahman',
        role: 'Head judge · Al-Noor Institute',
        avatarUrl: null,
        quote: 'Independent scoring removed the pressure of the stage. Every judge submits from their own device and the platform reconciles everything instantly.',
        rating: 5,
        order: 1,
    },
    {
        id: 'default-testimonial-2',
        name: 'Imam Sulaiman Diallo',
        role: 'Competition organizer · Djibouti',
        avatarUrl: null,
        quote: 'We moved from spreadsheets to OpenMusabaqa in one weekend. Registration, groups and the leaderboard now run themselves.',
        rating: 5,
        order: 2,
    },
    {
        id: 'default-testimonial-3',
        name: 'Hafiz Yusuf Karim',
        role: 'Contestant · 2025 season',
        avatarUrl: null,
        quote: 'I could follow my own progress and see the final ranking without waiting for an announcement. It felt transparent and dignified.',
        rating: 5,
        order: 3,
    },
];

const DEFAULT_TEAM: CmsTeamMemberItem[] = [
    {
        id: 'default-team-1',
        name: 'Hassan BUKURU',
        role: 'Executive Director',
        bio: 'Sets the strategic direction of OpenMusabaqa and leads partnerships with mosques, academies and foundations.',
        avatarUrl: '/gallery/ceo.jpeg',
        twitter: null,
        linkedin: null,
        order: 1,
    },
    {
        id: 'default-team-2',
        name: 'Ahmad Abbas',
        role: 'Head of Products',
        bio: 'Architects the whole platform, aligns the product roadmap across teams and leads the company’s quality standards.',
        avatarUrl: '/gallery/cto.jpeg',
        twitter: null,
        linkedin: null,
        order: 2,
    },
    {
        id: 'default-team-3',
        name: 'Hussein BUTOYI',
        role: 'Head of Operations',
        bio: 'Leads the quality and success of partnerships, organizations and competitions, and helps shape the company’s vision.',
        avatarUrl: '/gallery/coo.png',
        twitter: null,
        linkedin: null,
        order: 3,
    },
];

const DEFAULT_GALLERY: CmsGalleryItem[] = [
    { id: 'default-gallery-1', title: 'Opening ceremony', caption: 'Reciters and judges gather for the opening session.', imageUrl: '/gallery/gallery-1.svg', featured: true, order: 1 },
    { id: 'default-gallery-2', title: 'Judging in progress', caption: 'Independent scoring on dedicated devices.', imageUrl: '/gallery/gallery-2.svg', featured: false, order: 2 },
    { id: 'default-gallery-3', title: 'Live stage', caption: 'The stage display follows every selection in real time.', imageUrl: '/gallery/gallery-3.svg', featured: false, order: 3 },
    { id: 'default-gallery-4', title: 'Awards night', caption: 'Celebrating the reciters and the organizations behind them.', imageUrl: '/gallery/gallery-4.svg', featured: false, order: 4 },
];

const DEFAULT_PARTNERS: CmsPartnerItem[] = [
    { id: 'default-partner-1', name: 'Al-Noor Institute', logoUrl: null, website: null, tier: 'gold', order: 1 },
    { id: 'default-partner-2', name: 'Quran Academy', logoUrl: null, website: null, tier: 'silver', order: 2 },
    { id: 'default-partner-3', name: 'Dar Al-Hikma Foundation', logoUrl: null, website: null, tier: 'partner', order: 3 },
    { id: 'default-partner-4', name: 'Nur Media', logoUrl: null, website: null, tier: 'partner', order: 4 },
];

export const DEFAULT_LANDING_CONTENT: LandingContent = {
    sections: Object.fromEntries(CMS_SECTIONS.map((section) => [section.key, true])),
    sectionOrder: CMS_SECTIONS.map((section) => section.key),
    hero: DEFAULT_HERO,
    cta: DEFAULT_CTA,
    milestones: DEFAULT_MILESTONES,
    stats: DEFAULT_STATS,
    testimonials: DEFAULT_TESTIMONIALS,
    team: DEFAULT_TEAM,
    gallery: DEFAULT_GALLERY,
    partners: DEFAULT_PARTNERS,
};

export async function getLandingContent(): Promise<LandingContent> {
    try {
        const [sections, hero, cta, milestones, stats, testimonials, team, gallery, partners] = await Promise.all([
            prisma.cmsSection.findMany(),
            prisma.cmsHero.findUnique({ where: { id: 'default' } }),
            prisma.cmsCta.findUnique({ where: { id: 'default' } }),
            prisma.cmsMilestone.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
            prisma.cmsStat.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
            prisma.cmsTestimonial.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
            prisma.cmsTeamMember.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
            prisma.cmsGalleryItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
            prisma.cmsPartner.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
        ]);

        const sectionState: Record<string, boolean> = Object.fromEntries(
            CMS_SECTIONS.map((section) => [section.key, true]),
        );
        for (const section of sections) {
            if (section.key in sectionState) sectionState[section.key] = section.enabled;
        }

        const orderByKey = new Map(sections.map((section) => [section.key, section.order]));
        const sectionOrder = [...CMS_SECTIONS]
            .sort((a, b) => (orderByKey.get(a.key) ?? a.order) - (orderByKey.get(b.key) ?? b.order))
            .map((section) => section.key);

        return {
            sections: sectionState,
            sectionOrder,
            hero: hero
                ? {
                      badge: hero.badge,
                      title: hero.title,
                      subtitle: hero.subtitle,
                      primaryCta: hero.primaryCta,
                      primaryLink: hero.primaryLink === '#register' ? '/signup' : hero.primaryLink,
                      secondaryCta: hero.secondaryCta,
                      secondaryLink: hero.secondaryLink === '#register' ? '/signup' : hero.secondaryLink,
                      imageUrl: hero.imageUrl,
                      whatsappUrl: hero.whatsappUrl,
                  }
                : DEFAULT_HERO,
            cta: cta
                ? {
                      title: cta.title,
                      description: cta.description,
                      primaryCta: cta.primaryCta,
                      primaryLink: cta.primaryLink === '#register' ? '/signup' : cta.primaryLink,
                      secondaryCta: cta.secondaryCta,
                      secondaryLink: cta.secondaryLink,
                  }
                : DEFAULT_CTA,
            milestones: milestones.length
                ? milestones.map((item) => ({
                      id: item.id,
                      year: item.year,
                      title: item.title,
                      description: item.description,
                      order: item.order,
                  }))
                : DEFAULT_MILESTONES,
            stats: stats.length
                ? stats.map((item) => ({
                      id: item.id,
                      label: item.label,
                      value: item.value,
                      suffix: item.suffix,
                      icon: item.icon,
                      order: item.order,
                  }))
                : DEFAULT_STATS,
            testimonials: testimonials.length
                ? testimonials.map((item) => ({
                      id: item.id,
                      name: item.name,
                      role: item.role,
                      avatarUrl: item.avatarUrl,
                      quote: item.quote,
                      rating: item.rating,
                      order: item.order,
                  }))
                : DEFAULT_TESTIMONIALS,
            team: team.length
                ? team.map((item) => ({
                      id: item.id,
                      name: item.name,
                      role: item.role,
                      bio: item.bio,
                      avatarUrl: item.avatarUrl,
                      twitter: item.twitter,
                      linkedin: item.linkedin,
                      order: item.order,
                  }))
                : DEFAULT_TEAM,
            gallery: gallery.length
                ? gallery.map((item) => ({
                      id: item.id,
                      title: item.title,
                      caption: item.caption,
                      imageUrl: item.imageUrl,
                      featured: item.featured,
                      order: item.order,
                  }))
                : DEFAULT_GALLERY,
            partners: partners.length
                ? partners.map((item) => ({
                      id: item.id,
                      name: item.name,
                      logoUrl: item.logoUrl,
                      website: item.website,
                      tier: item.tier,
                      order: item.order,
                  }))
                : DEFAULT_PARTNERS,
        };
    } catch (error) {
        console.error('Landing content unavailable, serving defaults:', error);
        return DEFAULT_LANDING_CONTENT;
    }
}
