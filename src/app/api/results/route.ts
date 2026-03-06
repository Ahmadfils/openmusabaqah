import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    // Return participants with their qualitative notes
    const participants = await prisma.participant.findMany({
        where: { groupId },
        include: { score: true },
        orderBy: {
            score: {
                points: 'desc'
            }
        }
    });

    return NextResponse.json(participants);
}
