import 'server-only';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { HttpError } from '@/lib/http';
import type { SessionUser, UserRole } from '@/lib/types';

export async function requireUser(): Promise<SessionUser> {
    const user = await getSession();
    if (!user) throw new HttpError(401, 'Authentication required');
    return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
    const user = await requireUser();
    if (!roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this resource');
    return user;
}

export async function requireOrganizationAdmin(): Promise<SessionUser & { organizationId: string }> {
    const user = await requireRole('ADMIN');
    if (!user.organizationId) throw new HttpError(403, 'Your account is not attached to an organization');
    return user as SessionUser & { organizationId: string };
}

export async function requireCompetitionAccess(competitionId: string) {
    const user = await requireUser();
    const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { id: true, organizationId: true, name: true, slug: true },
    });
    if (!competition) throw new HttpError(404, 'Competition not found');

    if (user.role === 'SUPERADMIN') return { user, competition };
    if (user.role === 'ADMIN' && competition.organizationId === user.organizationId) {
        return { user, competition };
    }
    if (user.role === 'JUDGE') {
        const assignment = await prisma.judgeAssignment.findUnique({
            where: { userId_competitionId: { userId: user.id, competitionId } },
            select: { isActive: true },
        });
        if (assignment?.isActive) return { user, competition };
    }
    throw new HttpError(403, 'You do not have access to this competition');
}

export async function requireCompetitionManager(competitionId: string) {
    const user = await requireRole('ADMIN', 'SUPERADMIN');
    const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { id: true, organizationId: true, name: true, slug: true },
    });
    if (!competition) throw new HttpError(404, 'Competition not found');
    if (user.role !== 'SUPERADMIN' && competition.organizationId !== user.organizationId) {
        throw new HttpError(403, 'You do not have access to this competition');
    }
    return { user, competition };
}

export async function requireScoringJudge(competitionId: string): Promise<SessionUser> {
    const user = await requireRole('JUDGE');
    const assignment = await prisma.judgeAssignment.findUnique({
        where: { userId_competitionId: { userId: user.id, competitionId } },
        select: { isActive: true },
    });
    if (!assignment?.isActive) throw new HttpError(403, 'You are not assigned to this competition');
    return user;
}

export async function requireOrganizationJudge(judgeId: string) {
    const user = await requireOrganizationAdmin();
    const judge = await prisma.user.findUnique({
        where: { id: judgeId },
        select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
            organizationId: true,
            isActive: true,
        },
    });
    if (!judge || judge.role !== 'JUDGE' || judge.organizationId !== user.organizationId) {
        throw new HttpError(404, 'Judge not found');
    }
    return { user, judge };
}

export async function canViewLeaderboard(
    user: SessionUser | null,
    competition: { organizationId: string; id: string },
): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'SUPERADMIN') return true;
    if (user.role === 'ADMIN') return user.organizationId === competition.organizationId;
    const assignment = await prisma.judgeAssignment.findUnique({
        where: { userId_competitionId: { userId: user.id, competitionId: competition.id } },
        select: { isActive: true },
    });
    return Boolean(assignment?.isActive);
}
