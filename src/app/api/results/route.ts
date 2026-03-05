import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    const participants = await prisma.participant.findMany({
        where: { groupId },
        include: { score: true },
        orderBy: [
            { score: { points: 'desc' } },
            { name: 'asc' }
        ]
    });

    // Filter for those who have a score (optional, or show all)
    return NextResponse.json(participants);
}
