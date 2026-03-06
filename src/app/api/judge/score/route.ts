import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { participantId, notes, batchNumber, groupId } = await request.json();

        // Save qualitative notes for the participant
        const score = await prisma.score.upsert({
            where: { participantId },
            update: { notes },
            create: { participantId, notes },
        });

        // Broadcast the confirmed batch number to participants via SystemState
        if (batchNumber !== undefined) {
            await prisma.systemState.upsert({
                where: { id: 'default' },
                update: { currentBatchNumber: batchNumber, currentGroupId: groupId },
                create: { id: 'default', currentBatchNumber: batchNumber, currentGroupId: groupId },
            });
        }

        return NextResponse.json(score);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }
}
