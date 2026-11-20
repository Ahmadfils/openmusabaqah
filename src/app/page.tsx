import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { getLandingContent } from '@/lib/cms';
import type { CmsSectionKey } from '@/lib/cms-types';
import { getFeaturedLeaderboards, getPublicCompetitions } from '@/lib/landing-data';
import LandingHeader from '@/components/landing/LandingHeader';
import Hero from '@/components/landing/Hero';
import { StatsSection, TeamSection, TestimonialsSection, VisionSection } from '@/components/landing/AboutSections';
import { CtaSection, GallerySection, PartnersSection } from '@/components/landing/ShowcaseSections';
import { CompetitionsSection, LeaderboardsSection } from '@/components/landing/DirectorySections';
import NewsletterSection from '@/components/landing/NewsletterSection';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const [content, competitions, leaderboards] = await Promise.all([
        getLandingContent(),
        getPublicCompetitions(6),
        getFeaturedLeaderboards(3),
    ]);
    const { sections } = content;

    const sectionContent: Record<CmsSectionKey, ReactNode> = {
        hero: <Hero hero={content.hero} />,
        competitions: <CompetitionsSection competitions={competitions} />,
        leaderboards: <LeaderboardsSection previews={leaderboards} />,
        vision: <VisionSection milestones={content.milestones} />,
        stats: <StatsSection stats={content.stats} />,
        testimonials: <TestimonialsSection testimonials={content.testimonials} />,
        team: <TeamSection team={content.team} />,
        gallery: <GallerySection items={content.gallery} />,
        partners: <PartnersSection partners={content.partners} />,
        cta: <CtaSection cta={content.cta} />,
        newsletter: <NewsletterSection />,
    };

    return (
        <main className="min-h-screen">
            <LandingHeader />
            {content.sectionOrder.map((key) => (sections[key] ? <Fragment key={key}>{sectionContent[key]}</Fragment> : null))}
            <LandingFooter />
            <BackToTop />
        </main>
    );
}
