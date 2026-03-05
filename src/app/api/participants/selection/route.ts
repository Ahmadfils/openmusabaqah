import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET question selection for a participant
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });

    const selection = await prisma.selection.findUnique({
        where: { participantId },
        include: { question: true },
    });

    return NextResponse.json({ selection });
}
