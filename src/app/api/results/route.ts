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
        orderBy: { name: 'asc' },
    });

    // Sort: scored participants first, then alphabetically
    const sorted = participants.sort((a: any, b: any) => {
        const aHas = !!a.score?.notes;
        const bHas = !!b.score?.notes;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return a.name.localeCompare(b.name);
    });

    return NextResponse.json(sorted);
}
