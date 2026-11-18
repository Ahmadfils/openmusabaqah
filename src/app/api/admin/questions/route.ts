import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    optionalInt,
    optionalString,
    readJson,
    requiredInt,
    requiredString,
} from '@/lib/http';
import { requireCompetitionManager } from '@/lib/access';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

function difficulty(value: unknown): string {
    if (value === undefined) return 'medium';
    if (typeof value !== 'string' || !DIFFICULTIES.includes(value as (typeof DIFFICULTIES)[number])) {
        throw new HttpError(400, 'difficulty must be easy, medium or hard');
    }
    return value;
}

async function assertGroup(groupId: string, competitionId: string) {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { competitionId: true },
    });
    if (!group || group.competitionId !== competitionId) {
        throw new HttpError(400, 'The selected group does not belong to this competition');
    }
}

export async function GET(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');
        const groupId = searchParams.get('groupId');
        if (!competitionId) throw new HttpError(400, 'competitionId is required');
        await requireCompetitionManager(competitionId);

        const questions = await prisma.question.findMany({
            where: { competitionId, ...(groupId ? { groupId } : {}) },
            include: { group: { select: { id: true, name: true } } },
            orderBy: [{ groupId: 'asc' }, { number: 'asc' }, { createdAt: 'asc' }],
        });
        return NextResponse.json(questions);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const competitionId = requiredString(body.competitionId, 'competitionId');
        await requireCompetitionManager(competitionId);

        const groupId = requiredString(body.groupId, 'groupId');
        await assertGroup(groupId, competitionId);

        const number = requiredInt(body.number, 'number', { min: 1, max: 999 });
        const surah = requiredString(body.surah, 'surah', { max: 120 });
        const surahArabic = optionalString(body.surahArabic, 'surahArabic', { max: 120 });
        const surahNumber = requiredInt(body.surahNumber, 'surahNumber', { min: 1, max: 114 });
        const startAyah = optionalInt(body.startAyah, 'startAyah', { min: 1, max: 286 });
        const endAyah = optionalInt(body.endAyah, 'endAyah', { min: 1, max: 286 });
        if (startAyah !== null && endAyah !== null && endAyah < startAyah) {
            throw new HttpError(400, 'endAyah must be greater than or equal to startAyah');
        }

        const question = await prisma.question.create({
            data: {
                competitionId,
                groupId,
                number,
                surah,
                surahArabic,
                surahNumber,
                startAyah,
                endAyah,
                difficulty: difficulty(body.difficulty),
            },
            include: { group: { select: { id: true, name: true } } },
        });
        return NextResponse.json(question, { status: 201 });
    });
}

export async function PUT(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const id = requiredString(body.id, 'id');
        const existing = await prisma.question.findUnique({
            where: { id },
            select: { competitionId: true },
        });
        if (!existing) throw new HttpError(404, 'Question not found');
        await requireCompetitionManager(existing.competitionId);

        const groupId = requiredString(body.groupId, 'groupId');
        await assertGroup(groupId, existing.competitionId);

        const startAyah = optionalInt(body.startAyah, 'startAyah', { min: 1, max: 286 });
        const endAyah = optionalInt(body.endAyah, 'endAyah', { min: 1, max: 286 });
        if (startAyah !== null && endAyah !== null && endAyah < startAyah) {
            throw new HttpError(400, 'endAyah must be greater than or equal to startAyah');
        }

        const question = await prisma.question.update({
            where: { id },
            data: {
                groupId,
                number: requiredInt(body.number, 'number', { min: 1, max: 999 }),
                surah: requiredString(body.surah, 'surah', { max: 120 }),
                surahArabic: optionalString(body.surahArabic, 'surahArabic', { max: 120 }),
                surahNumber: requiredInt(body.surahNumber, 'surahNumber', { min: 1, max: 114 }),
                startAyah,
                endAyah,
                difficulty: difficulty(body.difficulty),
                ...(typeof body.isUsed === 'boolean' ? { isUsed: body.isUsed } : {}),
            },
            include: { group: { select: { id: true, name: true } } },
        });
        return NextResponse.json(question);
    });
}

export async function DELETE(request: Request) {
    return handleRoute(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new HttpError(400, 'id is required');

        const question = await prisma.question.findUnique({
            where: { id },
            select: { competitionId: true },
        });
        if (!question) throw new HttpError(404, 'Question not found');
        await requireCompetitionManager(question.competitionId);

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    });
}
