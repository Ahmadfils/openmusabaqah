import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    // Fetch selections for participants in this group
    const selections = await prisma.selection.findMany({
        where: {
            participant: { groupId }
        },
        include: {
            participant: {
                include: { score: true }
            },
            question: true
        },
        orderBy: { selectedAt: 'desc' }
    });

    return NextResponse.json(selections);
}
