import 'server-only';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function issueVerificationToken(organization: { id: string; email: string }): Promise<string> {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    await prisma.$transaction([
        prisma.emailVerificationToken.deleteMany({
            where: { organizationId: organization.id, usedAt: null },
        }),
        prisma.emailVerificationToken.create({
            data: {
                token,
                email: organization.email,
                organizationId: organization.id,
                expiresAt,
            },
        }),
    ]);

    return token;
}

export async function consumeVerificationToken(token: string): Promise<{ organizationId: string } | null> {
    const record = await prisma.emailVerificationToken.findUnique({
        where: { token },
        select: { id: true, organizationId: true, expiresAt: true, usedAt: true },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) return null;
    if (record.usedAt) {
        const organization = await prisma.organization.findUnique({
            where: { id: record.organizationId },
            select: { isVerified: true },
        });
        return organization?.isVerified ? { organizationId: record.organizationId } : null;
    }

    const now = new Date();
    await prisma.$transaction([
        prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: now } }),
        prisma.organization.update({
            where: { id: record.organizationId },
            data: { isVerified: true, verifiedAt: now },
        }),
        prisma.emailVerificationToken.updateMany({
            where: { organizationId: record.organizationId, usedAt: null },
            data: { usedAt: now },
        }),
    ]);

    return { organizationId: record.organizationId };
}
