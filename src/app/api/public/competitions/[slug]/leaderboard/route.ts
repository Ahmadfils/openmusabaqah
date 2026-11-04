import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError } from '@/lib/http';
import { getSession } from '@/lib/auth';
import { canViewLeaderboard } from '@/lib/access';
import { buildLeaderboard } from '@/lib/leaderboard';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
    return handleRoute(async () => {
        const { slug } = await context.params;

        const competition = await prisma.competition.findUnique({
            where: { slug },
            select: {
                id: true,
                organizationId: true,
                leaderboardVisibility: true,
                organization: { select: { isActive: true } },
            },
        });
        if (!competition || !competition.organization.isActive) {
            throw new HttpError(404, 'Competition not found');
        }

        const user = await getSession();
        if (competition.leaderboardVisibility === 'PRIVATE') {
            const allowed = await canViewLeaderboard(user, competition);
            if (!allowed) {
                throw new HttpError(user ? 403 : 401, 'This leaderboard is private');
            }
        }

        const leaderboard = await buildLeaderboard(competition.id, {
            pointsVisible: competition.leaderboardVisibility !== 'HIDDEN_POINTS',
        });
        return NextResponse.json(leaderboard);
    });
}
