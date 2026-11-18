import { getLandingContent } from '@/lib/cms';
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
    const sections = content.sections;

    return (
        <main className="min-h-screen">
            <LandingHeader />
            {sections.hero && <Hero hero={content.hero} />}
            {sections.competitions && <CompetitionsSection competitions={competitions} />}
            {sections.leaderboards && <LeaderboardsSection previews={leaderboards} />}
            {sections.vision && <VisionSection milestones={content.milestones} />}
            {sections.stats && <StatsSection stats={content.stats} />}
            {sections.testimonials && <TestimonialsSection testimonials={content.testimonials} />}
            {sections.team && <TeamSection team={content.team} />}
            {sections.gallery && <GallerySection items={content.gallery} />}
            {sections.partners && <PartnersSection partners={content.partners} />}
            {sections.cta && <CtaSection cta={content.cta} />}
            {sections.newsletter && <NewsletterSection />}
            <LandingFooter />
            <BackToTop />
        </main>
    );
}
