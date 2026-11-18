import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, readJson } from '@/lib/http';
import { requireRole } from '@/lib/access';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    return handleRoute(async () => {
        await requireRole('SUPERADMIN');
        const { id } = await context.params;
        const body = await readJson(request);

        const isActive = body.isActive;
        if (typeof isActive !== 'boolean') throw new HttpError(400, 'isActive must be a boolean');

        const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
        if (!existing) throw new HttpError(404, 'Organization not found');

        const organization = await prisma.$transaction(async (tx) => {
            const updated = await tx.organization.update({
                where: { id },
                data: { isActive },
            });
            if (!isActive) {
                await tx.user.updateMany({
                    where: { organizationId: id },
                    data: { sessionVersion: { increment: 1 } },
                });
            }
            return updated;
        });

        return NextResponse.json(organization);
    });
}
