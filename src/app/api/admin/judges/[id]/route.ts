import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    normalizeUsername,
    optionalString,
    readJson,
    validatePassword,
} from '@/lib/http';
import { requireOrganizationJudge } from '@/lib/access';
import { generatePassword, hashPassword } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    return handleRoute(async () => {
        const { id } = await context.params;
        await requireOrganizationJudge(id);
        const body = await readJson(request);

        const data: Record<string, unknown> = {};
        if (body.displayName !== undefined) {
            data.displayName = optionalString(body.displayName, 'displayName', { max: 120 });
        }
        if (body.email !== undefined) data.email = optionalString(body.email, 'email', { max: 200 });
        if (body.phone !== undefined) data.phone = optionalString(body.phone, 'phone', { max: 40 });
        if (body.username !== undefined) {
            const username = normalizeUsername(body.username);
            const existing = await prisma.user.findFirst({
                where: { username, id: { not: id } },
                select: { id: true },
            });
            if (existing) throw new HttpError(409, 'This username is already taken');
            data.username = username;
        }

        let generatedPassword: string | null = null;
        if (body.resetPassword === true) {
            generatedPassword = generatePassword();
            data.passwordHash = hashPassword(generatedPassword);
        } else if (body.password !== undefined && body.password !== null && body.password !== '') {
            const password = validatePassword(body.password);
            data.passwordHash = hashPassword(password);
        }

        let revoked = false;
        if (body.isActive !== undefined) {
            if (typeof body.isActive !== 'boolean') throw new HttpError(400, 'isActive must be a boolean');
            data.isActive = body.isActive;
            revoked = !body.isActive;
        }

        if (generatedPassword || data.passwordHash !== undefined || revoked) {
            data.sessionVersion = { increment: 1 };
        }

        const judge = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                phone: true,
                isActive: true,
                judgeAssignments: {
                    select: {
                        id: true,
                        isActive: true,
                        competition: { select: { id: true, name: true, slug: true, status: true } },
                    },
                },
            },
        });

        return NextResponse.json({ judge, generatedPassword });
    });
}
