import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { homeForRole, startSession, verifyPassword } from '@/lib/auth';
import { handleRoute, HttpError, normalizeUsername, readJson } from '@/lib/http';
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from '@/lib/login-rate-limit';

function clientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const username = normalizeUsername(body.username);
        const password = typeof body.password === 'string' ? body.password : '';
        if (!password) throw new HttpError(400, 'Password is required');

        const rateKey = `${clientIp(request)}:${username}`;
        try {
            assertLoginAllowed(rateKey);
        } catch (error) {
            throw new HttpError(429, error instanceof Error ? error.message : 'Too many login attempts');
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                passwordHash: true,
                role: true,
                displayName: true,
                organizationId: true,
                isActive: true,
                sessionVersion: true,
                organization: { select: { isActive: true, name: true } },
            },
        });

        if (!user || !verifyPassword(password, user.passwordHash)) {
            recordLoginFailure(rateKey);
            throw new HttpError(401, 'Invalid username or password');
        }
        if (!user.isActive) throw new HttpError(403, 'This account is disabled');
        if (user.role !== 'SUPERADMIN' && (!user.organizationId || !user.organization?.isActive)) {
            throw new HttpError(403, 'This organization is disabled');
        }

        clearLoginFailures(rateKey);
        await startSession(user);

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                displayName: user.displayName,
                organizationId: user.organizationId,
                organizationName: user.organization?.name ?? null,
            },
            redirectTo: homeForRole(user.role),
        });
    });
}
