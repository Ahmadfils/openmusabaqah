import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET participants for a group
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    const participants = await prisma.participant.findMany({
        where: { groupId },
        orderBy: { name: 'asc' },
    });

    return NextResponse.json(participants);
}
