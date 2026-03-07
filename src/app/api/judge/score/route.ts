import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { participantId, notes, points, currentBatchNumber, groupId } = body;

        // Save qualitative notes for the participant
        const score = await prisma.score.upsert({
            where: { participantId },
            update: { notes, points },
            create: { participantId, notes, points },
        });

        // Mark all questions in this batch as used
        if (currentBatchNumber !== undefined && groupId) {
            await prisma.question.updateMany({
                where: {
                    number: currentBatchNumber,
                    groupId: groupId,
                },
                data: { isUsed: true },
            });
        }

        // Clear the system state using raw SQL (this ends the participant's turn)
        console.log('API: POST /api/judge/score - Turn finished, deleting SystemState via Raw SQL');
        await prisma.$executeRawUnsafe('DELETE FROM "SystemState"');

        return NextResponse.json(score);
    } catch (error) {
        console.error('API Error: Score saving failed', error);
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }
}
