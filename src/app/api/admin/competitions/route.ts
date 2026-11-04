import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalString, readJson, requiredString, slugify } from '@/lib/http';
import { requireRole } from '@/lib/access';
import { uniqueCompetitionSlug } from '@/lib/identifiers';
import { DEFAULT_CRITERIA } from '@/lib/scoring';

export async function GET(request: Request) {
    return handleRoute(async () => {
        const user = await requireRole('ADMIN', 'SUPERADMIN');
        const { searchParams } = new URL(request.url);
        const requestedOrg = searchParams.get('organizationId');

        let organizationId: string | undefined;
        if (user.role === 'ADMIN') {
            if (!user.organizationId) throw new HttpError(403, 'Your account is not attached to an organization');
            organizationId = user.organizationId;
        } else if (requestedOrg) {
            organizationId = requestedOrg;
        }

        const competitions = await prisma.competition.findMany({
            where: organizationId ? { organizationId } : {},
            include: {
                organization: { select: { id: true, name: true, slug: true } },
                _count: { select: { groups: true, participants: true, questions: true, judgeAssignments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(competitions);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const user = await requireRole('ADMIN', 'SUPERADMIN');
        const body = await readJson(request);
        const name = requiredString(body.name, 'name', { min: 2, max: 120 });
        const description = optionalString(body.description, 'description', { max: 1000 });
        const explicitSlug = optionalString(body.slug, 'slug', { max: 60 });

        let organizationId = user.organizationId;
        if (user.role === 'SUPERADMIN') {
            organizationId = requiredString(body.organizationId, 'organizationId');
            const organization = await prisma.organization.findUnique({
                where: { id: organizationId },
                select: { id: true },
            });
            if (!organization) throw new HttpError(404, 'Organization not found');
        }
        if (!organizationId) throw new HttpError(403, 'Your account is not attached to an organization');

        let slug: string;
        if (explicitSlug) {
            slug = slugify(explicitSlug);
            const existing = await prisma.competition.findUnique({ where: { slug }, select: { id: true } });
            if (existing) throw new HttpError(409, 'This competition slug is already in use');
        } else {
            slug = await uniqueCompetitionSlug(name);
        }

        try {
            const competition = await prisma.competition.create({
                data: {
                    organizationId,
                    name,
                    slug,
                    description,
                    scoringCriteria: DEFAULT_CRITERIA,
                },
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                    _count: { select: { groups: true, participants: true, questions: true, judgeAssignments: true } },
                },
            });
            return NextResponse.json(competition, { status: 201 });
        } catch (error: unknown) {
            if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
                throw new HttpError(409, 'A competition with this name or slug already exists for the organization');
            }
            throw error;
        }
    });
}
