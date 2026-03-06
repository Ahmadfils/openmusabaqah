import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/questions?groupId=xxx
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        const questions = await prisma.question.findMany({
            where: { groupId },
            orderBy: [{ number: 'asc' }, { createdAt: 'asc' }],
        });

        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

// POST /api/admin/questions — Create a question (can share batch number with others)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            number, surah, surahArabic, surahNumber,
            startAyah, endAyah, difficulty, groupId
        } = body;

        const question = await prisma.question.create({
            data: {
                number: Number(number),
                surah,
                surahArabic,
                surahNumber: Number(surahNumber),
                startAyah: startAyah ? Number(startAyah) : null,
                endAyah: endAyah ? Number(endAyah) : null,
                difficulty: difficulty || 'medium',
                groupId,
            },
        });

        return NextResponse.json(question);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}

// PUT /api/admin/questions
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            id, number, surah, surahArabic, surahNumber,
            startAyah, endAyah, difficulty
        } = body;

        const question = await prisma.question.update({
            where: { id },
            data: {
                number: Number(number),
                surah,
                surahArabic,
                surahNumber: Number(surahNumber),
                startAyah: startAyah ? Number(startAyah) : null,
                endAyah: endAyah ? Number(endAyah) : null,
                difficulty,
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// DELETE /api/admin/questions?id=xxx
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
