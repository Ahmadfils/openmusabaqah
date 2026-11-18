export type CmsSectionKey =
    | 'hero'
    | 'vision'
    | 'stats'
    | 'testimonials'
    | 'team'
    | 'gallery'
    | 'partners'
    | 'cta'
    | 'newsletter'
    | 'competitions'
    | 'leaderboards';

export type CmsSectionMeta = {
    key: CmsSectionKey;
    label: string;
    order: number;
    description: string;
};

export const CMS_SECTIONS: CmsSectionMeta[] = [
    { key: 'hero', label: 'Hero & portals', order: 1, description: 'Headline, badge, calls to action and portal shortcuts.' },
    { key: 'vision', label: 'Vision & milestones', order: 2, description: 'Mission statement and timeline of milestones.' },
    { key: 'stats', label: 'Statistics', order: 3, description: 'Headline metrics displayed with animated counters.' },
    { key: 'testimonials', label: 'Testimonials', order: 4, description: 'Quotes from judges, organizers and contestants.' },
    { key: 'team', label: 'Team', order: 5, description: 'Founder profiles, roles and social links.' },
    { key: 'gallery', label: 'Gallery', order: 6, description: 'Highlights from past competitions and ceremonies.' },
    { key: 'partners', label: 'Partners & sponsors', order: 7, description: 'Partner logo wall with sponsorship tiers.' },
    { key: 'cta', label: 'Call to action', order: 8, description: 'Sponsor and partner invitation block.' },
    { key: 'newsletter', label: 'Newsletter', order: 9, description: 'Email capture synced with Brevo contact lists.' },
    { key: 'competitions', label: 'Public competitions', order: 10, description: 'Live list of competitions published by verified organizations.' },
    { key: 'leaderboards', label: 'Public leaderboards', order: 11, description: 'Top ranked reciters from public leaderboards.' },
];

export type CmsHeroContent = {
    badge: string | null;
    title: string;
    subtitle: string;
    primaryCta: string;
    primaryLink: string;
    secondaryCta: string | null;
    secondaryLink: string | null;
    imageUrl: string | null;
};

export type CmsCtaContent = {
    title: string;
    description: string;
    primaryCta: string;
    primaryLink: string;
    secondaryCta: string | null;
    secondaryLink: string | null;
};

export type CmsMilestoneItem = {
    id: string;
    year: string;
    title: string;
    description: string;
    order: number;
};

export type CmsStatItem = {
    id: string;
    label: string;
    value: string;
    suffix: string | null;
    icon: string | null;
    order: number;
};

export type CmsTestimonialItem = {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    quote: string;
    rating: number;
    order: number;
};

export type CmsTeamMemberItem = {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatarUrl: string | null;
    twitter: string | null;
    linkedin: string | null;
    order: number;
};

export type CmsGalleryItem = {
    id: string;
    title: string;
    caption: string | null;
    imageUrl: string;
    featured: boolean;
    order: number;
};

export type CmsPartnerItem = {
    id: string;
    name: string;
    logoUrl: string | null;
    website: string | null;
    tier: string;
    order: number;
};

export type LandingContent = {
    sections: Record<string, boolean>;
    hero: CmsHeroContent;
    cta: CmsCtaContent;
    milestones: CmsMilestoneItem[];
    stats: CmsStatItem[];
    testimonials: CmsTestimonialItem[];
    team: CmsTeamMemberItem[];
    gallery: CmsGalleryItem[];
    partners: CmsPartnerItem[];
};
