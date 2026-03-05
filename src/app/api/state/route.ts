import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/state — Fetch the current system state
export async function GET() {
    try {
        const state = await prisma.systemState.findUnique({
            where: { id: 'default' },
        });

        if (!state) {
            // Initialize if not exists
            const newState = await prisma.systemState.create({
                data: { id: 'default' },
            });
            return NextResponse.json(newState);
        }

        return NextResponse.json(state);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
    }
}

// POST /api/state — Update the system state
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { currentGroupId, currentParticipantId, currentQuestionId } = body;

        const state = await prisma.systemState.upsert({
            where: { id: 'default' },
            update: {
                currentGroupId,
                currentParticipantId,
                currentQuestionId,
            },
            create: {
                id: 'default',
                currentGroupId,
                currentParticipantId,
                currentQuestionId,
            },
        });

        return NextResponse.json(state);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
    }
}
