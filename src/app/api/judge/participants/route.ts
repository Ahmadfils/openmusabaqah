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
import { requireScoringJudge } from '@/lib/access';
import { createParticipant, deleteParticipant, updateParticipant, type ParticipantInput } from '@/lib/participants';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        await requireScoringJudge(competitionId);

        const participant = await createParticipant(competitionId, {
            name: requiredString(body.name, 'name', { min: 1, max: 120 }),
            identifier: optionalString(body.identifier, 'identifier', { max: 80 }),
            age: optionalInt(body.age, 'age', { min: 3, max: 120 }),
            country: optionalString(body.country, 'country', { max: 80 }),
            city: optionalString(body.city, 'city', { max: 80 }),
            phone: optionalString(body.phone, 'phone', { max: 40 }),
            groupId: optionalString(body.groupId, 'groupId'),
            batchNumber: optionalInt(body.batchNumber, 'batchNumber', { min: 1, max: 999 }),
            status: 'APPROVED',
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
        await requireScoringJudge(existing.competitionId);

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
        await requireScoringJudge(participant.competitionId);

        await deleteParticipant(id);
        return NextResponse.json({ ok: true });
    });
}
