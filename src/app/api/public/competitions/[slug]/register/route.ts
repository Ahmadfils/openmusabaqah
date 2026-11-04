import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    optionalString,
    readJson,
    requiredInt,
    requiredString,
} from '@/lib/http';
import { createParticipant } from '@/lib/participants';

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    return handleRoute(async () => {
        const { slug } = await context.params;
        const body = await readJson(request);

        const competition = await prisma.competition.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                publicRegistration: true,
                registrationOpen: true,
                organization: { select: { isActive: true } },
                groups: { select: { id: true } },
            },
        });
        if (!competition || !competition.organization.isActive) {
            throw new HttpError(404, 'Competition not found');
        }
        if (!competition.publicRegistration) {
            throw new HttpError(403, 'Public registration is not enabled for this competition');
        }
        if (!competition.registrationOpen || competition.status === 'COMPLETED' || competition.status === 'ARCHIVED') {
            throw new HttpError(409, 'Registration is closed');
        }

        const desiredGroupIds = Array.isArray(body.desiredGroupIds)
            ? (body.desiredGroupIds as unknown[]).filter((id): id is string => typeof id === 'string')
            : [];
        if (desiredGroupIds.length === 0) {
            throw new HttpError(400, 'Choose at least one desired group');
        }
        const allowedGroups = new Set(competition.groups.map((group) => group.id));
        if (desiredGroupIds.some((id) => !allowedGroups.has(id))) {
            throw new HttpError(400, 'One or more selected groups are invalid');
        }

        const participant = await createParticipant(competition.id, {
            name: requiredString(body.name, 'name', { min: 1, max: 120 }),
            age: requiredInt(body.age, 'age', { min: 3, max: 120 }),
            country: requiredString(body.country, 'country', { min: 1, max: 80 }),
            city: requiredString(body.city, 'city', { min: 1, max: 80 }),
            phone: optionalString(body.phone, 'phone', { max: 40 }),
            desiredGroupIds,
            groupId: desiredGroupIds[0],
            status: 'PENDING',
            source: 'PUBLIC_FORM',
        });

        return NextResponse.json(
            {
                participant: {
                    id: participant.id,
                    name: participant.name,
                    registrationCode: participant.registrationCode,
                    status: participant.status,
                },
                competition: { name: competition.name, slug: competition.slug },
                message: 'Registration received. Keep your reference code.',
            },
            { status: 201 },
        );
    });
}
