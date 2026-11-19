import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    normalizeUsername,
    optionalString,
    readJson,
    requiredString,
    validatePassword,
} from '@/lib/http';
import { requireOrganizationAdmin } from '@/lib/access';
import { generatePassword, hashPassword } from '@/lib/auth';
import { uniqueUsername } from '@/lib/identifiers';
import { sendJudgeInviteEmail } from '@/lib/email';

export async function GET() {
    return handleRoute(async () => {
        const admin = await requireOrganizationAdmin();

        const judges = await prisma.user.findMany({
            where: { organizationId: admin.organizationId, role: 'JUDGE' },
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
                judgeAssignments: {
                    select: {
                        id: true,
                        isActive: true,
                        competition: { select: { id: true, name: true, slug: true, status: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(judges);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const admin = await requireOrganizationAdmin();
        const body = await readJson(request);

        const displayName = requiredString(body.displayName, 'displayName', { min: 2, max: 120 });
        const email = optionalString(body.email, 'email', { max: 200 });
        const phone = optionalString(body.phone, 'phone', { max: 40 });

        const requestedUsername = optionalString(body.username, 'username', { max: 32 });
        const username = requestedUsername
            ? normalizeUsername(requestedUsername)
            : await uniqueUsername(email?.split('@')[0] || displayName);

        const requestedPassword = optionalString(body.password, 'password', { max: 128 });
        const generatedPassword = requestedPassword ? null : generatePassword();
        const password = requestedPassword ? validatePassword(requestedPassword) : generatedPassword!;

        const competitionIds = Array.isArray(body.competitionIds)
            ? (body.competitionIds as unknown[]).filter((id): id is string => typeof id === 'string')
            : [];
        if (competitionIds.length > 0) {
            const count = await prisma.competition.count({
                where: { id: { in: competitionIds }, organizationId: admin.organizationId },
            });
            if (count !== new Set(competitionIds).size) {
                throw new HttpError(400, 'One or more competitions do not belong to your organization');
            }
        }

        const existingUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (existingUsername) throw new HttpError(409, 'This username is already taken');

        const judge = await prisma.user.create({
            data: {
                username,
                passwordHash: hashPassword(password),
                role: 'JUDGE',
                displayName,
                email,
                phone,
                organizationId: admin.organizationId,
                judgeAssignments: {
                    create: competitionIds.map((competitionId) => ({ competitionId })),
                },
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
                judgeAssignments: {
                    select: {
                        id: true,
                        isActive: true,
                        competition: { select: { id: true, name: true, slug: true, status: true } },
                    },
                },
            },
        });

        let invite = { sent: false, skipped: true };
        if (email) {
            try {
                const [organization, assignedCompetitions] = await Promise.all([
                    prisma.organization.findUnique({
                        where: { id: admin.organizationId },
                        select: { name: true },
                    }),
                    competitionIds.length
                        ? prisma.competition.findMany({
                              where: { id: { in: competitionIds } },
                              select: { name: true },
                          })
                        : Promise.resolve([]),
                ]);
                const emailResult = await sendJudgeInviteEmail({
                    to: email,
                    judgeName: displayName,
                    username,
                    password,
                    organizationName: organization?.name ?? 'OpenMusabaqa',
                    competitionName: assignedCompetitions.map((competition) => competition.name).join(', ') || undefined,
                    createdById: admin.id,
                });
                invite = { sent: emailResult.ok && !emailResult.skipped, skipped: emailResult.skipped };
            } catch (error) {
                console.error('Unable to send judge invitation email:', error);
                invite = { sent: false, skipped: false };
            }
        }

        return NextResponse.json({ judge, generatedPassword, invite }, { status: 201 });
    });
}
