import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalString, readJson, requiredString } from '@/lib/http';
import { requireCompetitionManager } from '@/lib/access';

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionManager(competitionId);

        const groups = await prisma.group.findMany({
            where: { competitionId },
            include: { _count: { select: { participants: true, questions: true } } },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(groups);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        await requireCompetitionManager(competitionId);

        const name = requiredString(body.name, 'name', { min: 1, max: 80 });
        const description = optionalString(body.description, 'description', { max: 500 });

        try {
            const group = await prisma.group.create({
                data: { competitionId, name, description },
                include: { _count: { select: { participants: true, questions: true } } },
            });
            return NextResponse.json(group, { status: 201 });
        } catch (error: unknown) {
            if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
                throw new HttpError(409, 'A group with this name already exists in the competition');
            }
            throw error;
        }
    });
}

export async function PUT(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const id = requiredString(body.id, 'id');
        const group = await prisma.group.findUnique({ where: { id }, select: { competitionId: true } });
        if (!group) throw new HttpError(404, 'Group not found');
        await requireCompetitionManager(group.competitionId);

        const name = requiredString(body.name, 'name', { min: 1, max: 80 });
        const description = optionalString(body.description, 'description', { max: 500 });

        try {
            const updated = await prisma.group.update({
                where: { id },
                data: { name, description },
                include: { _count: { select: { participants: true, questions: true } } },
            });
            return NextResponse.json(updated);
        } catch (error: unknown) {
            if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
                throw new HttpError(409, 'A group with this name already exists in the competition');
            }
            throw error;
        }
    });
}

export async function DELETE(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new HttpError(400, 'id is required');

        const group = await prisma.group.findUnique({
            where: { id },
            select: {
                competitionId: true,
                _count: { select: { participants: true, questions: true } },
            },
        });
        if (!group) throw new HttpError(404, 'Group not found');
        await requireCompetitionManager(group.competitionId);

        if (group._count.participants > 0 || group._count.questions > 0) {
            throw new HttpError(409, 'Move or delete the participants and questions in this group first');
        }

        await prisma.group.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    });
}
