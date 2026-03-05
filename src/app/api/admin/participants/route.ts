import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/participants?groupId=xxx
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        const participants = await prisma.participant.findMany({
            where: groupId ? { groupId } : {},
            include: {
                group: true,
                score: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(participants);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }
}

// POST /api/admin/participants
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, identifier, groupId } = body;

        const participant = await prisma.participant.create({
            data: { name, identifier, groupId },
        });

        return NextResponse.json(participant);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
    }
}

// PUT /api/admin/participants
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, identifier, groupId } = body;

        const participant = await prisma.participant.update({
            where: { id },
            data: { name, identifier, groupId },
        });

        return NextResponse.json(participant);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
    }
}

// DELETE /api/admin/participants?id=xxx
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.participant.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 });
    }
}
