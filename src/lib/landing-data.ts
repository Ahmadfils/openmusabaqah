import 'server-only';

import { prisma } from '@/lib/prisma';
import { buildLeaderboard } from '@/lib/leaderboard';

export type PublicCompetitionCard = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    leaderboardVisibility: string;
    publicRegistration: boolean;
    registrationOpen: boolean;
    organizationName: string;
    groups: number;
    participants: number;
};

export type LeaderboardPreview = {
    id: string;
    name: string;
    slug: string;
    organizationName: string;
    status: string;
    rows: { id: string; name: string; groupName: string | null; average: number | null; rank: number | null }[];
};

export async function getPublicCompetitions(limit = 6): Promise<PublicCompetitionCard[]> {
    try {
        const competitions = await prisma.competition.findMany({
            where: {
                status: { in: ['ACTIVE', 'COMPLETED'] },
                leaderboardVisibility: { in: ['PUBLIC', 'HIDDEN_POINTS'] },
                organization: { isActive: true, isVerified: true },
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                status: true,
                leaderboardVisibility: true,
                publicRegistration: true,
                registrationOpen: true,
                organization: { select: { name: true } },
                _count: { select: { groups: true, participants: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            take: limit,
        });

        return competitions.map((competition) => ({
            id: competition.id,
            name: competition.name,
            slug: competition.slug,
            description: competition.description,
            status: competition.status,
            leaderboardVisibility: competition.leaderboardVisibility,
            publicRegistration: competition.publicRegistration,
            registrationOpen: competition.registrationOpen,
            organizationName: competition.organization.name,
            groups: competition._count.groups,
            participants: competition._count.participants,
        }));
    } catch (error) {
        console.error('Unable to load public competitions:', error);
        return [];
    }
}

export async function getFeaturedLeaderboards(limit = 3): Promise<LeaderboardPreview[]> {
    try {
        const competitions = await prisma.competition.findMany({
            where: {
                status: { in: ['ACTIVE', 'COMPLETED'] },
                leaderboardVisibility: 'PUBLIC',
                organization: { isActive: true, isVerified: true },
            },
            select: { id: true, name: true, slug: true, status: true, organization: { select: { name: true } } },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            take: limit,
        });

        const previews = await Promise.all(
            competitions.map(async (competition) => {
                const leaderboard = await buildLeaderboard(competition.id, { pointsVisible: true });
                return {
                    id: competition.id,
                    name: competition.name,
                    slug: competition.slug,
                    organizationName: competition.organization.name,
                    status: competition.status,
                    rows: leaderboard.rows
                        .filter((row) => row.complete && row.rank !== null)
                        .slice(0, 3)
                        .map((row) => ({
                            id: row.id,
                            name: row.name,
                            groupName: row.groupName,
                            average: row.average,
                            rank: row.rank,
                        })),
                };
            }),
        );

        return previews;
    } catch (error) {
        console.error('Unable to load leaderboard previews:', error);
        return [];
    }
}
