import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, readJson, requiredInt } from '@/lib/http';
import { activeJudgeCount } from '@/lib/participants';

async function livePayload(slug: string) {
    const competition = await prisma.competition.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            leaderboardVisibility: true,
            organization: { select: { name: true, isActive: true } },
            groups: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
            liveState: true,
        },
    });
    if (!competition || !competition.organization.isActive) throw new HttpError(404, 'Competition not found');

    const state = competition.liveState;
    const judgeCount = await activeJudgeCount(competition.id);

    let participant = null;
    if (state?.currentParticipantId) {
        participant = await prisma.participant.findUnique({
            where: { id: state.currentParticipantId },
            select: {
                id: true,
                name: true,
                identifier: true,
                groupId: true,
                batchNumber: true,
                group: { select: { name: true } },
                judgeScores: { select: { id: true } },
            },
        });
    }

    const groupId = state?.currentGroupId ?? participant?.groupId ?? null;
    const questions = groupId
        ? await prisma.question.findMany({
              where: { competitionId: competition.id, groupId },
              select: { number: true, isUsed: true },
              orderBy: [{ number: 'asc' }],
          })
        : [];

    const batchMap = new Map<number, boolean>();
    for (const question of questions) {
        batchMap.set(question.number, (batchMap.get(question.number) ?? false) || question.isUsed);
    }

    const submittedCount = participant?.judgeScores.length ?? 0;
    return {
        competition: {
            id: competition.id,
            name: competition.name,
            slug: competition.slug,
            status: competition.status,
            leaderboardVisibility: competition.leaderboardVisibility,
            organizationName: competition.organization.name,
        },
        live: {
            status: state?.status ?? 'inactive',
            currentBatchNumber: state?.currentBatchNumber ?? null,
            currentGroupId: groupId,
            participant: participant
                ? {
                      id: participant.id,
                      name: participant.name,
                      identifier: participant.identifier,
                      groupName: participant.group?.name ?? null,
                  }
                : null,
            submittedCount,
            judgeCount,
            complete: judgeCount > 0 && submittedCount >= judgeCount,
            updatedAt: state?.updatedAt ?? null,
        },
        batches: Array.from(batchMap.entries()).map(([batchNumber, isUsed]) => ({ batchNumber, isUsed })),
        updatedAt: new Date().toISOString(),
    };
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
    return handleRoute(async () => {
        const { slug } = await context.params;
        return NextResponse.json(await livePayload(slug));
    });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    return handleRoute(async () => {
        const { slug } = await context.params;
        const body = await readJson(request);
        const batchNumber = requiredInt(body.batchNumber, 'batchNumber', { min: 1, max: 999 });

        const competition = await prisma.competition.findUnique({
            where: { slug },
            select: {
                id: true,
                status: true,
                organization: { select: { isActive: true } },
                liveState: true,
            },
        });
        if (!competition || !competition.organization.isActive) {
            throw new HttpError(404, 'Competition not found');
        }
        if (competition.status === 'COMPLETED' || competition.status === 'ARCHIVED') {
            throw new HttpError(409, 'This competition is closed');
        }

        const state = competition.liveState;
        if (!state?.currentParticipantId || !state.currentGroupId) {
            throw new HttpError(409, 'The judge has not activated a participant yet');
        }
        if (state.status !== 'waiting_batch') {
            throw new HttpError(409, 'A batch has already been selected for this turn');
        }

        const questions = await prisma.question.findMany({
            where: {
                competitionId: competition.id,
                groupId: state.currentGroupId,
                number: batchNumber,
            },
            select: { isUsed: true },
        });
        if (questions.length === 0) throw new HttpError(404, 'This batch does not exist');
        if (questions.some((question) => question.isUsed)) {
            throw new HttpError(409, 'This batch has already been used');
        }

        await prisma.$transaction([
            prisma.participant.update({
                where: { id: state.currentParticipantId },
                data: { batchNumber },
            }),
            prisma.liveState.update({
                where: { competitionId: competition.id },
                data: { currentBatchNumber: batchNumber, status: 'batch_selected' },
            }),
        ]);

        return NextResponse.json(await livePayload(slug));
    });
}
