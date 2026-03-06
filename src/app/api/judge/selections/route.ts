import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/judge/selections?groupId=xxx
// Returns all DISTINCT batch numbers that are "in use" for the group,
// plus participant info fetched from SystemState if needed.
// Now simplified: we just return all questions grouped by batch number,
// and the system state tells us what batch the participant has chosen.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    // Return all questions in the group so the judge can build the batch view
    const questions = await prisma.question.findMany({
        where: { groupId },
        orderBy: [{ number: 'asc' }, { createdAt: 'asc' }],
    });

    // Group by batch number
    const batches: Record<number, any[]> = {};
    for (const q of questions) {
        if (!batches[q.number]) batches[q.number] = [];
        batches[q.number].push(q);
    }

    const batchList = Object.entries(batches).map(([num, qs]) => ({
        batchNumber: Number(num),
        questions: qs,
        isUsed: qs.some(q => q.isUsed),
    }));

    return NextResponse.json(batchList);
}
