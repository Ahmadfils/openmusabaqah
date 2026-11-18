import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalInt, optionalString, readJson, requiredString } from '@/lib/http';
import { requireScoringJudge } from '@/lib/access';
import { activeJudgeCount } from '@/lib/participants';
import { averagePoints, calculateScore, normalizeCriteria, participantProgress } from '@/lib/scoring';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        const participantId = requiredString(body.participantId, 'participantId');
        const user = await requireScoringJudge(competitionId);

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            select: { id: true, pointsMode: true, scoringCriteria: true },
        });
        if (!competition) throw new HttpError(404, 'Competition not found');

        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            select: { id: true, competitionId: true, name: true, groupId: true, batchNumber: true, status: true },
        });
        if (!participant || participant.competitionId !== competitionId) {
            throw new HttpError(404, 'Participant not found in this competition');
        }
        if (participant.status === 'REJECTED') {
            throw new HttpError(409, 'This participant has been rejected');
        }

        const criteria = normalizeCriteria(competition.scoringCriteria);
        let calculated: { points: number; breakdown: Record<string, number>; maxPoints: number };
        try {
            calculated = calculateScore(
                criteria,
                competition.pointsMode,
                (body.criteria ?? {}) as Record<string, number>,
            );
        } catch (error) {
            throw new HttpError(400, error instanceof Error ? error.message : 'Invalid score');
        }

        const batchNumber = optionalInt(body.batchNumber, 'batchNumber', { min: 1, max: 999 }) ?? participant.batchNumber;
        const notes = optionalString(body.notes, 'notes', { max: 2000 });

        const beforeCount = await prisma.judgeScore.count({ where: { participantId } });

        const score = await prisma.judgeScore.upsert({
            where: { participantId_judgeId: { participantId, judgeId: user.id } },
            update: {
                points: calculated.points,
                criteria: calculated.breakdown,
                notes,
                batchNumber,
                competitionId,
            },
            create: {
                participantId,
                judgeId: user.id,
                competitionId,
                points: calculated.points,
                criteria: calculated.breakdown,
                notes,
                batchNumber,
            },
            select: {
                id: true,
                participantId: true,
                judgeId: true,
                points: true,
                criteria: true,
                notes: true,
                batchNumber: true,
                submittedAt: true,
                updatedAt: true,
            },
        });

        const [judgeCount, afterCount, scores] = await Promise.all([
            activeJudgeCount(competitionId),
            prisma.judgeScore.count({ where: { participantId } }),
            prisma.judgeScore.findMany({ where: { participantId }, select: { points: true } }),
        ]);

        const progress = participantProgress(afterCount, judgeCount);
        const completedNow = progress.complete && beforeCount < judgeCount;

        if (progress.complete) {
            if (batchNumber && participant.groupId) {
                await prisma.question.updateMany({
                    where: { competitionId, groupId: participant.groupId, number: batchNumber },
                    data: { isUsed: true },
                });
            }
            await prisma.liveState.updateMany({
                where: { competitionId, currentParticipantId: participantId },
                data: {
                    status: 'completed',
                    ...(batchNumber ? { currentBatchNumber: batchNumber } : {}),
                },
            });
        }

        return NextResponse.json({
            score,
            progress,
            completedNow,
            maxPoints: calculated.maxPoints,
            average: progress.complete ? averagePoints(scores.map((item) => item.points)) : null,
        });
    });
}
