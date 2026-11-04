import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    optionalInt,
    optionalString,
    readJson,
    requiredString,
} from '@/lib/http';
import { requireCompetitionManager } from '@/lib/access';
import {
    activeJudgeCount,
    createParticipant,
    deleteParticipant,
    summarizeParticipant,
    updateParticipant,
    type ParticipantInput,
} from '@/lib/participants';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

function parseStatus(value: unknown): ParticipantInput['status'] | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !STATUSES.includes(value as (typeof STATUSES)[number])) {
        throw new HttpError(400, 'status must be PENDING, APPROVED or REJECTED');
    }
    return value as ParticipantInput['status'];
}

function parseDesiredGroups(value: unknown): string[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        throw new HttpError(400, 'desiredGroupIds must be an array of group ids');
    }
    return value as string[];
}

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        const groupId = searchParams.get('groupId');
        const status = searchParams.get('status');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionManager(competitionId);

        const [participants, judgeCount] = await Promise.all([
            prisma.participant.findMany({
                where: {
                    competitionId,
                    ...(groupId ? { groupId } : {}),
                    ...(status && STATUSES.includes(status as (typeof STATUSES)[number])
                        ? { status: status as (typeof STATUSES)[number] }
                        : {}),
                },
                include: {
                    group: { select: { id: true, name: true } },
                    judgeScores: {
                        select: {
                            id: true,
                            judgeId: true,
                            points: true,
                            notes: true,
                            criteria: true,
                            batchNumber: true,
                            submittedAt: true,
                            judge: { select: { displayName: true, username: true } },
                        },
                        orderBy: { submittedAt: 'asc' },
                    },
                },
                orderBy: [{ name: 'asc' }],
            }),
            activeJudgeCount(competitionId),
        ]);

        return NextResponse.json(participants.map((participant) => summarizeParticipant(participant, judgeCount)));
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        await requireCompetitionManager(competitionId);

        const participant = await createParticipant(competitionId, {
            name: requiredString(body.name, 'name', { min: 1, max: 120 }),
            identifier: optionalString(body.identifier, 'identifier', { max: 80 }),
            age: optionalInt(body.age, 'age', { min: 3, max: 120 }),
            country: optionalString(body.country, 'country', { max: 80 }),
            city: optionalString(body.city, 'city', { max: 80 }),
            phone: optionalString(body.phone, 'phone', { max: 40 }),
            groupId: optionalString(body.groupId, 'groupId'),
            batchNumber: optionalInt(body.batchNumber, 'batchNumber', { min: 1, max: 999 }),
            desiredGroupIds: parseDesiredGroups(body.desiredGroupIds),
            status: parseStatus(body.status) ?? 'APPROVED',
        });

        return NextResponse.json(participant, { status: 201 });
    });
}

export async function PUT(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const id = requiredString(body.id, 'id');
        const existing = await prisma.participant.findUnique({
            where: { id },
            select: { competitionId: true },
        });
        if (!existing) throw new HttpError(404, 'Participant not found');
        await requireCompetitionManager(existing.competitionId);

        const input: Partial<ParticipantInput> = {};
        if (body.name !== undefined) input.name = requiredString(body.name, 'name', { min: 1, max: 120 });
        if (body.identifier !== undefined) input.identifier = optionalString(body.identifier, 'identifier', { max: 80 });
        if (body.age !== undefined) input.age = optionalInt(body.age, 'age', { min: 3, max: 120 });
        if (body.country !== undefined) input.country = optionalString(body.country, 'country', { max: 80 });
        if (body.city !== undefined) input.city = optionalString(body.city, 'city', { max: 80 });
        if (body.phone !== undefined) input.phone = optionalString(body.phone, 'phone', { max: 40 });
        if (body.groupId !== undefined) input.groupId = optionalString(body.groupId, 'groupId');
        if (body.batchNumber !== undefined) {
            input.batchNumber = optionalInt(body.batchNumber, 'batchNumber', { min: 1, max: 999 });
        }
        if (body.desiredGroupIds !== undefined) input.desiredGroupIds = parseDesiredGroups(body.desiredGroupIds);
        if (body.status !== undefined) input.status = parseStatus(body.status);

        const participant = await updateParticipant(id, input);
        return NextResponse.json(participant);
    });
}

export async function DELETE(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new HttpError(400, 'id is required');

        const participant = await prisma.participant.findUnique({
            where: { id },
            select: { competitionId: true },
        });
        if (!participant) throw new HttpError(404, 'Participant not found');
        await requireCompetitionManager(participant.competitionId);

        await deleteParticipant(id);
        return NextResponse.json({ ok: true });
    });
}
