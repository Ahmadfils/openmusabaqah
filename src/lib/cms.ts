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
    { id: 'default-milestone-1', year: 'February 2026', title: 'Platform MVP', description: 'The first working version of OpenMusabaqa was built and tested.', order: 1 },
    { id: 'default-milestone-2', year: 'March 2026', title: 'First musabaqa', description: 'Used for the first musabaqa at Bujumbura Q. Asiatique.', order: 2 },
    { id: 'default-milestone-3', year: 'March 2026', title: 'Live stages & public portals', description: 'Ran across three days of competitions with live stages and public portals.', order: 3 },
    { id: 'default-milestone-4', year: 'End of March 2026', title: 'Appropriation at Ahlul Bayt Institute', description: 'The platform was adopted for the competitions at Ahlul Bayt Institute.', order: 4 },
    { id: 'default-milestone-5', year: 'October 2026', title: 'Multi-organization platform', description: 'Opened the platform to multiple organizations with isolated workspaces.', order: 5 },
];

const DEFAULT_STATS: CmsStatItem[] = [
    { id: 'default-stat-1', label: 'Competitions hosted', value: '3', suffix: '', icon: 'trophy', order: 1 },
    { id: 'default-stat-2', label: 'Participating reciters', value: '52', suffix: '', icon: 'users', order: 2 },
    { id: 'default-stat-3', label: 'Questions recited', value: '128', suffix: '', icon: 'book', order: 3 },
    { id: 'default-stat-4', label: 'Registered organizations', value: '2', suffix: '', icon: 'building', order: 4 },
];

const DEFAULT_TESTIMONIALS: CmsTestimonialItem[] = [
    {
        id: 'default-testimonial-1',
        name: 'Sheikh Radjabu',
        role: 'Competition organizer · Bujumbura',
        avatarUrl: null,
        quote: 'Points that used to take the whole evening are now calculated in minutes. The judges work calmly and independently, and the management can follow every round without chasing paperwork.',
        rating: 4,
        order: 1,
    },
    {
        id: 'default-testimonial-2',
        name: 'Hafiza Rahma Sam',
        role: 'Head judge · Ahlul Bayt',
        avatarUrl: null,
        quote: 'Independent scoring removed the pressure of the stage. Every judge submits from their own device and the platform reconciles everything instantly.',
        rating: 5,
        order: 2,
    },
    {
        id: 'default-testimonial-3',
        name: 'Hafiz Abdoul Maleek',
        role: 'Contestant · 2026 season edition 1',
        avatarUrl: null,
        quote: 'I could follow my own progress and see the final ranking without waiting for an announcement. It felt transparent and dignified.',
        rating: 4,
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
    { id: 'default-gallery-1', title: 'Musabaqa 1', caption: null, imageUrl: '/gallery/musabaqa-1.jpeg', featured: true, order: 1 },
    { id: 'default-gallery-2', title: 'Musabaqa 2', caption: null, imageUrl: '/gallery/musabaqa-2.jpeg', featured: false, order: 2 },
    { id: 'default-gallery-3', title: 'Musabaqa 3', caption: null, imageUrl: '/gallery/musabaqa-3.jpeg', featured: false, order: 3 },
    { id: 'default-gallery-4', title: 'Musabaqa 4', caption: null, imageUrl: '/gallery/musabaqa-4.jpeg', featured: false, order: 4 },
    { id: 'default-gallery-5', title: 'Musabaqa 5', caption: null, imageUrl: '/gallery/musabaqa-5.jpeg', featured: false, order: 5 },
    { id: 'default-gallery-6', title: 'Musabaqa 6', caption: null, imageUrl: '/gallery/musabaqa-6.jpeg', featured: false, order: 6 },
    { id: 'default-gallery-7', title: 'Musabaqa 7', caption: null, imageUrl: '/gallery/musabaqa-7.jpeg', featured: false, order: 7 },
    { id: 'default-gallery-8', title: 'Musabaqa 9', caption: null, imageUrl: '/gallery/musabaqa-9.jpeg', featured: false, order: 8 },
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
