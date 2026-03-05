import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/groups
export async function GET() {
    try {
        const groups = await prisma.group.findMany({
            include: {
                _count: {
                    select: { participants: true, questions: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(groups);
    } catch (error: any) {
        console.error('GET Groups Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch groups' }, { status: 500 });
    }
}

// POST /api/admin/groups
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description } = body;

        const group = await prisma.group.create({
            data: { name, description },
        });

        return NextResponse.json(group);
    } catch (error: any) {
        console.error('POST Group Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 });
    }
}

// PUT /api/admin/groups
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, description } = body;

        const group = await prisma.group.update({
            where: { id },
            data: { name, description },
        });

        return NextResponse.json(group);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

// DELETE /api/admin/groups?id=xxx
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Note: Prisma will handle deletion of related records if configured or error if not.
        // Assuming we want to prevent deletion if there are participants/questions for safety.
        await prisma.group.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete group (ensure it has no participants or questions)' }, { status: 500 });
    }
}
