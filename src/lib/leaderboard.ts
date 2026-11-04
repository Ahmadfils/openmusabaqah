import 'server-only';

import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { averagePoints, participantProgress } from '@/lib/scoring';
import { activeJudgeCount } from '@/lib/participants';
import type { LeaderboardRow } from '@/lib/types';

export async function buildLeaderboard(competitionId: string, options: { pointsVisible: boolean }) {
    const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            leaderboardVisibility: true,
            organization: { select: { name: true } },
        },
    });
    if (!competition) throw new HttpError(404, 'Competition not found');

    const judgeCount = await activeJudgeCount(competitionId);
    const participants = await prisma.participant.findMany({
        where: { competitionId, status: 'APPROVED' },
        select: {
            id: true,
            name: true,
            registrationCode: true,
            group: { select: { name: true } },
            status: true,
            judgeScores: { select: { points: true } },
        },
        orderBy: { name: 'asc' },
    });

    const rows: LeaderboardRow[] = participants.map((participant) => {
        const progress = participantProgress(participant.judgeScores.length, judgeCount);
        const average = progress.complete
            ? averagePoints(participant.judgeScores.map((score) => score.points))
            : null;
        return {
            id: participant.id,
            name: participant.name,
            registrationCode: participant.registrationCode,
            groupName: participant.group?.name ?? null,
            status: participant.status,
            submittedCount: progress.submittedCount,
            judgeCount: progress.judgeCount,
            complete: progress.complete,
            average: options.pointsVisible ? average : null,
            pointsVisible: options.pointsVisible,
            rank: null,
        };
    });

    if (options.pointsVisible) {
        rows.sort((left, right) => {
            if (left.complete !== right.complete) return left.complete ? -1 : 1;
            if (left.average !== null && right.average !== null && left.average !== right.average) {
                return right.average - left.average;
            }
            return left.name.localeCompare(right.name);
        });
        let rank = 0;
        for (const row of rows) {
            if (!row.complete) continue;
            rank += 1;
            row.rank = rank;
        }
    } else {
        rows.sort((left, right) => {
            const groupCompare = (left.groupName ?? '').localeCompare(right.groupName ?? '');
            if (groupCompare !== 0) return groupCompare;
            return left.name.localeCompare(right.name);
        });
    }

    return {
        competition: {
            id: competition.id,
            name: competition.name,
            slug: competition.slug,
            status: competition.status,
            leaderboardVisibility: competition.leaderboardVisibility,
            organizationName: competition.organization.name,
        },
        rows,
        judgeCount,
        updatedAt: new Date().toISOString(),
    };
}
