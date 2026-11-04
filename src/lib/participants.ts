import 'server-only';

import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { uniqueRegistrationCode } from '@/lib/identifiers';
import { averagePoints, participantProgress } from '@/lib/scoring';

export type ParticipantInput = {
    name: string;
    identifier?: string | null;
    age?: number | null;
    country?: string | null;
    city?: string | null;
    phone?: string | null;
    groupId?: string | null;
    batchNumber?: number | null;
    desiredGroupIds?: string[];
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    source?: 'ADMIN' | 'PUBLIC_FORM';
};

async function assertGroupInCompetition(groupId: string, competitionId: string): Promise<void> {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { competitionId: true },
    });
    if (!group || group.competitionId !== competitionId) {
        throw new HttpError(400, 'The selected group does not belong to this competition');
    }
}

async function assertDesiredGroups(ids: string[] | undefined, competitionId: string): Promise<void> {
    if (!ids || ids.length === 0) return;
    const count = await prisma.group.count({
        where: { id: { in: [...new Set(ids)] }, competitionId },
    });
    if (count !== new Set(ids).size) {
        throw new HttpError(400, 'One or more desired groups do not belong to this competition');
    }
}

export async function createParticipant(competitionId: string, input: ParticipantInput) {
    if (input.groupId) await assertGroupInCompetition(input.groupId, competitionId);
    await assertDesiredGroups(input.desiredGroupIds, competitionId);
    const registrationCode = await uniqueRegistrationCode();

    try {
        return await prisma.participant.create({
            data: {
                competitionId,
                registrationCode,
                name: input.name,
                identifier: input.identifier ?? null,
                age: input.age ?? null,
                country: input.country ?? null,
                city: input.city ?? null,
                phone: input.phone ?? null,
                groupId: input.groupId ?? null,
                batchNumber: input.batchNumber ?? null,
                desiredGroupIds: input.desiredGroupIds ?? [],
                status: input.status ?? 'APPROVED',
                source: input.source ?? 'ADMIN',
            },
            include: { group: { select: { id: true, name: true } } },
        });
    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
            throw new HttpError(409, 'This participant identifier is already used in the competition');
        }
        throw error;
    }
}

export async function updateParticipant(
    participantId: string,
    input: Partial<ParticipantInput>,
) {
    const existing = await prisma.participant.findUnique({
        where: { id: participantId },
        select: { id: true, competitionId: true },
    });
    if (!existing) throw new HttpError(404, 'Participant not found');

    if (input.groupId) await assertGroupInCompetition(input.groupId, existing.competitionId);
    await assertDesiredGroups(input.desiredGroupIds, existing.competitionId);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.identifier !== undefined) data.identifier = input.identifier;
    if (input.age !== undefined) data.age = input.age;
    if (input.country !== undefined) data.country = input.country;
    if (input.city !== undefined) data.city = input.city;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.groupId !== undefined) data.groupId = input.groupId;
    if (input.batchNumber !== undefined) data.batchNumber = input.batchNumber;
    if (input.desiredGroupIds !== undefined) data.desiredGroupIds = input.desiredGroupIds;
    if (input.status !== undefined) data.status = input.status;

    try {
        return await prisma.participant.update({
            where: { id: participantId },
            data,
            include: { group: { select: { id: true, name: true } } },
        });
    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
            throw new HttpError(409, 'This participant identifier is already used in the competition');
        }
        throw error;
    }
}

export async function deleteParticipant(participantId: string) {
    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        select: { id: true, competitionId: true },
    });
    if (!participant) throw new HttpError(404, 'Participant not found');

    await prisma.participant.delete({ where: { id: participantId } });
    await prisma.liveState.updateMany({
        where: { competitionId: participant.competitionId, currentParticipantId: participantId },
        data: {
            currentParticipantId: null,
            currentBatchNumber: null,
            currentGroupId: null,
            status: 'inactive',
        },
    });
}

export async function activeJudgeCount(competitionId: string): Promise<number> {
    return prisma.judgeAssignment.count({
        where: {
            competitionId,
            isActive: true,
            user: { isActive: true },
        },
    });
}

export function summarizeParticipant<
    T extends {
        judgeScores?: { points: number; judgeId: string; submittedAt: Date }[];
    },
>(participant: T, judgeCount: number) {
    const scores = participant.judgeScores ?? [];
    const progress = participantProgress(scores.length, judgeCount);
    return {
        ...participant,
        ...progress,
        average: progress.complete ? averagePoints(scores.map((score) => score.points)) : null,
    };
}
