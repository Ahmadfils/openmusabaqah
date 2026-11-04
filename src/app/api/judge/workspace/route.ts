import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalString } from '@/lib/http';
import { requireScoringJudge } from '@/lib/access';
import { activeJudgeCount } from '@/lib/participants';
import { averagePoints, normalizeCriteria, participantProgress } from '@/lib/scoring';

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        const groupId = searchParams.get('groupId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');

        const user = await requireScoringJudge(competitionId);

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                status: true,
                pointsMode: true,
                scoringCriteria: true,
                leaderboardVisibility: true,
                organization: { select: { name: true } },
                groups: { select: { id: true, name: true, description: true }, orderBy: { createdAt: 'asc' } },
            },
        });
        if (!competition) throw new HttpError(404, 'Competition not found');

        const selectedGroupId = optionalString(groupId, 'groupId');
        if (selectedGroupId && !competition.groups.some((group) => group.id === selectedGroupId)) {
            throw new HttpError(400, 'The selected group does not belong to this competition');
        }

        const [judgeCount, participants, questions, liveState, assignments] = await Promise.all([
            activeJudgeCount(competitionId),
            prisma.participant.findMany({
                where: {
                    competitionId,
                    status: { not: 'REJECTED' },
                    ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    identifier: true,
                    registrationCode: true,
                    age: true,
                    country: true,
                    city: true,
                    phone: true,
                    desiredGroupIds: true,
                    groupId: true,
                    batchNumber: true,
                    status: true,
                    source: true,
                    group: { select: { id: true, name: true } },
                    judgeScores: {
                        select: { judgeId: true, points: true, submittedAt: true, criteria: true, notes: true, batchNumber: true },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.question.findMany({
                where: { competitionId, ...(selectedGroupId ? { groupId: selectedGroupId } : {}) },
                include: { group: { select: { id: true, name: true } } },
                orderBy: [{ groupId: 'asc' }, { number: 'asc' }, { createdAt: 'asc' }],
            }),
            prisma.liveState.findUnique({ where: { competitionId } }),
            prisma.judgeAssignment.findMany({
                where: { competitionId, isActive: true, user: { isActive: true } },
                select: {
                    user: { select: { id: true, username: true, displayName: true } },
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        const batchMap = new Map<string, { batchNumber: number; groupId: string; groupName: string; questions: typeof questions; isUsed: boolean }>();
        for (const question of questions) {
            const key = `${question.groupId}:${question.number}`;
            const existing = batchMap.get(key);
            if (existing) {
                existing.questions.push(question);
                existing.isUsed = existing.isUsed || question.isUsed;
            } else {
                batchMap.set(key, {
                    batchNumber: question.number,
                    groupId: question.groupId,
                    groupName: question.group.name,
                    questions: [question],
                    isUsed: question.isUsed,
                });
            }
        }

        return NextResponse.json({
            competition: {
                ...competition,
                scoringCriteria: normalizeCriteria(competition.scoringCriteria),
            },
            groupId: selectedGroupId,
            judgeCount,
            participants: participants.map((participant) => {
                const myScore = participant.judgeScores.find((score) => score.judgeId === user.id) ?? null;
                const progress = participantProgress(participant.judgeScores.length, judgeCount);
                const { judgeScores, ...rest } = participant;
                return {
                    ...rest,
                    submittedCount: progress.submittedCount,
                    complete: progress.complete,
                    average: progress.complete ? averagePoints(judgeScores.map((score) => score.points)) : null,
                    myScore,
                };
            }),
            batches: Array.from(batchMap.values()).sort((left, right) =>
                left.groupName.localeCompare(right.groupName) || left.batchNumber - right.batchNumber,
            ),
            liveState,
            judges: assignments.map((assignment) => assignment.user),
            updatedAt: new Date().toISOString(),
        });
    });
}
