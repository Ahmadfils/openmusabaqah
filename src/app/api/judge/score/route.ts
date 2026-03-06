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

        // Broadcast the confirmed batch number to participants via SystemState
        if (currentBatchNumber !== undefined) {
            await prisma.systemState.upsert({
                where: { id: 'default' },
                update: { currentBatchNumber, currentGroupId: groupId },
                create: { id: 'default', currentBatchNumber, currentGroupId: groupId },
            });
        }

        return NextResponse.json(score);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }
}
