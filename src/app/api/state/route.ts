import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/state
export async function GET() {
    try {
        const state = await prisma.systemState.findFirst();

        if (!state) {
            console.log('API: GET /api/state - No state found, returning inactive defaults');
            return NextResponse.json({
                id: 'default',
                currentGroupId: null,
                currentParticipantId: null,
                currentBatchNumber: null,
                status: 'inactive'
            });
        }

        return NextResponse.json(state);
    } catch (error) {
        console.error('API Error: GET /api/state failed', error);
        return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
    }
}

// POST /api/state
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { currentGroupId, currentParticipantId, currentBatchNumber, status, reset } = body;

        // If reset flag is true, delete all rows using raw SQL to be absolutely sure
        if (reset) {
            console.log('API: POST /api/state - Reset requested, deleting all SystemState rows via Raw SQL');
            await prisma.$executeRawUnsafe('DELETE FROM "SystemState"');
            return NextResponse.json({
                success: true,
                message: 'All system state rows deleted via SQL',
                status: 'inactive'
            });
        }

        const state = await prisma.systemState.upsert({
            where: { id: 'default' },
            update: {
                currentGroupId,
                currentParticipantId,
                currentBatchNumber: currentBatchNumber ?? null,
                status: status ?? 'inactive',
            },
            create: {
                id: 'default',
                currentGroupId,
                currentParticipantId,
                currentBatchNumber: currentBatchNumber ?? null,
                status: status ?? 'inactive',
            },
        });

        return NextResponse.json(state);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
    }
}
