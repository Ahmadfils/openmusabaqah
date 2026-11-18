import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute } from '@/lib/http';
import { requireRole } from '@/lib/access';

export async function GET() {
    return handleRoute(async () => {
        const user = await requireRole('JUDGE');

        const assignments = await prisma.judgeAssignment.findMany({
            where: {
                userId: user.id,
                isActive: true,
                competition: { status: { not: 'ARCHIVED' } },
            },
            select: {
                id: true,
                competition: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        status: true,
                        pointsMode: true,
                        leaderboardVisibility: true,
                        organization: { select: { name: true } },
                        _count: { select: { groups: true, participants: true, questions: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(assignments.map((assignment) => assignment.competition));
    });
}
