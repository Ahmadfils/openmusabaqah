import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { participantId, points, notes } = await request.json();

        const score = await prisma.score.upsert({
            where: { participantId },
            update: { points, notes },
            create: { participantId, points, notes },
        });

        return NextResponse.json(score);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
    }
}
