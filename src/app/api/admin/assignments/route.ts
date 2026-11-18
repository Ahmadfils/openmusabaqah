import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, readJson, requiredString } from '@/lib/http';
import { requireCompetitionManager } from '@/lib/access';

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionManager(competitionId);

        const assignments = await prisma.judgeAssignment.findMany({
            where: { competitionId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        email: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(assignments);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        const judgeId = requiredString(body.judgeId, 'judgeId');
        const { competition } = await requireCompetitionManager(competitionId);

        const judge = await prisma.user.findUnique({
            where: { id: judgeId },
            select: { id: true, role: true, organizationId: true, isActive: true },
        });
        if (!judge || judge.role !== 'JUDGE' || judge.organizationId !== competition.organizationId) {
            throw new HttpError(404, 'Judge not found in this organization');
        }
        if (!judge.isActive) throw new HttpError(409, 'Enable this judge account before assigning it');

        const assignment = await prisma.judgeAssignment.upsert({
            where: { userId_competitionId: { userId: judgeId, competitionId } },
            update: { isActive: true },
            create: { userId: judgeId, competitionId },
            include: {
                user: {
                    select: { id: true, username: true, displayName: true, email: true, isActive: true },
                },
            },
        });

        return NextResponse.json(assignment);
    });
}

export async function DELETE(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        const judgeId = searchParams.get('judgeId');
        if (!competitionId || !judgeId) throw new HttpError(400, 'competitionId and judgeId are required');
        await requireCompetitionManager(competitionId);

        await prisma.judgeAssignment.deleteMany({ where: { competitionId, userId: judgeId } });
        return NextResponse.json({ ok: true });
    });
}
