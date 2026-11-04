import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalInt, optionalString, readJson } from '@/lib/http';
import { requireCompetitionAccess } from '@/lib/access';
import { activeJudgeCount } from '@/lib/participants';
import { averagePoints } from '@/lib/scoring';

const STATUSES = ['inactive', 'waiting_batch', 'batch_selected', 'judging', 'completed'] as const;

function parseStatus(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !STATUSES.includes(value as (typeof STATUSES)[number])) {
        throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    }
    return value;
}

async function statePayload(competitionId: string) {
    const [state, judgeCount] = await Promise.all([
        prisma.liveState.findUnique({ where: { competitionId } }),
        activeJudgeCount(competitionId),
    ]);

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
                status: true,
                group: { select: { name: true } },
                judgeScores: { select: { points: true, submittedAt: true, judgeId: true } },
            },
        });
    }

    return {
        competitionId,
        state: state ?? {
            competitionId,
            currentGroupId: null,
            currentParticipantId: null,
            currentBatchNumber: null,
            status: 'inactive',
            updatedAt: new Date().toISOString(),
        },
        judgeCount,
        participant: participant
            ? {
                  ...participant,
                  submittedCount: participant.judgeScores.length,
                  complete: judgeCount > 0 && participant.judgeScores.length >= judgeCount,
                  average:
                      judgeCount > 0 && participant.judgeScores.length >= judgeCount
                          ? averagePoints(participant.judgeScores.map((score) => score.points))
                          : null,
              }
            : null,
    };
}

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionAccess(competitionId);
        return NextResponse.json(await statePayload(competitionId));
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = optionalString(body.competitionId, 'competitionId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionAccess(competitionId);

        if (body.reset === true) {
            await prisma.liveState.upsert({
                where: { competitionId },
                update: {
                    currentGroupId: null,
                    currentParticipantId: null,
                    currentBatchNumber: null,
                    status: 'inactive',
                },
                create: { competitionId, status: 'inactive' },
            });
            return NextResponse.json(await statePayload(competitionId));
        }

        const requestedStatus = parseStatus(body.status);
        const participantId = optionalString(body.currentParticipantId, 'currentParticipantId');
        const batchNumber = optionalInt(body.currentBatchNumber, 'currentBatchNumber', { min: 1, max: 999 });

        if (participantId) {
            const participant = await prisma.participant.findUnique({
                where: { id: participantId },
                select: { id: true, competitionId: true, groupId: true },
            });
            if (!participant || participant.competitionId !== competitionId) {
                throw new HttpError(404, 'Participant not found in this competition');
            }

            if (batchNumber !== null) {
                if (!participant.groupId) throw new HttpError(400, 'Assign the participant to a group before choosing a batch');
                const batchCount = await prisma.question.count({
                    where: { competitionId, groupId: participant.groupId, number: batchNumber },
                });
                if (batchCount === 0) throw new HttpError(400, 'This batch does not exist in the participant group');
                await prisma.participant.update({
                    where: { id: participantId },
                    data: { batchNumber },
                });
            }

            const state = await prisma.liveState.upsert({
                where: { competitionId },
                update: {
                    currentParticipantId: participantId,
                    currentGroupId: participant.groupId,
                    currentBatchNumber: batchNumber,
                    status: requestedStatus ?? (batchNumber !== null ? 'judging' : 'waiting_batch'),
                },
                create: {
                    competitionId,
                    currentParticipantId: participantId,
                    currentGroupId: participant.groupId,
                    currentBatchNumber: batchNumber,
                    status: requestedStatus ?? (batchNumber !== null ? 'judging' : 'waiting_batch'),
                },
            });
            return NextResponse.json({ ...(await statePayload(competitionId)), state });
        }

        const existing = await prisma.liveState.findUnique({ where: { competitionId } });
        if (!existing) throw new HttpError(400, 'Set an active participant first');

        if (batchNumber !== null) {
            if (!existing.currentGroupId) throw new HttpError(400, 'The active participant has no group');
            const batchCount = await prisma.question.count({
                where: { competitionId, groupId: existing.currentGroupId, number: batchNumber },
            });
            if (batchCount === 0) throw new HttpError(400, 'This batch does not exist in the active group');
            if (existing.currentParticipantId) {
                await prisma.participant.update({
                    where: { id: existing.currentParticipantId },
                    data: { batchNumber },
                });
            }
        }

        await prisma.liveState.update({
            where: { competitionId },
            data: {
                ...(body.currentParticipantId === null
                    ? { currentParticipantId: null, currentGroupId: null, currentBatchNumber: null }
                    : {}),
                ...(batchNumber !== null ? { currentBatchNumber: batchNumber } : {}),
                ...(requestedStatus
                    ? { status: requestedStatus }
                    : batchNumber !== null
                      ? { status: 'batch_selected' }
                      : {}),
            },
        });

        return NextResponse.json(await statePayload(competitionId));
    });
}
