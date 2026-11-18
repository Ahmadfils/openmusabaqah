import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute } from '@/lib/http';

export async function GET() {
    return handleRoute(async () => {
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
                themeColor: true,
                logoUrl: true,
                organization: { select: { name: true } },
                _count: { select: { groups: true, participants: true } },
            },
            orderBy: [{ createdAt: 'desc' }],
        });
        return NextResponse.json(competitions);
    });
}
