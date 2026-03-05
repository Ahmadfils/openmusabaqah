import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { participantId, questionId } = await request.json();

        // Use a transaction to ensure atomic selection
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if question is still available
            const q = await tx.question.findUnique({ where: { id: questionId } });
            if (!q || q.isUsed) throw new Error('Question already taken');

            // 2. Mark question as used
            await tx.question.update({
                where: { id: questionId },
                data: { isUsed: true },
            });

            // 3. Create selection
            const selection = await tx.selection.create({
                data: { participantId, questionId },
                include: { question: true },
            });

            return selection;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Selection failed' }, { status: 400 });
    }
}
