import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    handleRoute,
    HttpError,
    optionalString,
    readJson,
    requiredString,
    slugify,
} from '@/lib/http';
import { requireCompetitionManager } from '@/lib/access';
import { normalizeCriteria, sanitizeCriteriaInput } from '@/lib/scoring';
import { activeJudgeCount } from '@/lib/participants';

const STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;
const VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN_POINTS'] as const;
const POINTS_MODES = ['FIXED', 'PERCENT'] as const;

function parseEnum<T extends readonly string[]>(value: unknown, allowed: T, field: string): T[number] | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !allowed.includes(value)) {
        throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}`);
    }
    return value as T[number];
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    return handleRoute(async () => {
        const { id } = await context.params;
        await requireCompetitionManager(id);

        const [competition, judgeCount] = await Promise.all([
            prisma.competition.findUnique({
                where: { id },
                include: {
                    organization: { select: { id: true, name: true, slug: true, email: true } },
                    groups: {
                        include: { _count: { select: { participants: true, questions: true } } },
                        orderBy: { createdAt: 'asc' },
                    },
                    judgeAssignments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    isActive: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    liveState: true,
                    _count: { select: { participants: true, questions: true } },
                },
            }),
            activeJudgeCount(id),
        ]);

        if (!competition) throw new HttpError(404, 'Competition not found');
        return NextResponse.json({
            ...competition,
            scoringCriteria: normalizeCriteria(competition.scoringCriteria),
            activeJudgeCount: judgeCount,
        });
    });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    return handleRoute(async () => {
        const { id } = await context.params;
        await requireCompetitionManager(id);
        const body = await readJson(request);

        const data: Record<string, unknown> = {};

        if (body.name !== undefined) data.name = requiredString(body.name, 'name', { min: 2, max: 120 });
        if (body.description !== undefined) data.description = optionalString(body.description, 'description', { max: 1000 });
        if (body.status !== undefined) data.status = parseEnum(body.status, STATUSES, 'status');
        if (body.leaderboardVisibility !== undefined) {
            data.leaderboardVisibility = parseEnum(body.leaderboardVisibility, VISIBILITIES, 'leaderboardVisibility');
        }
        if (body.pointsMode !== undefined) data.pointsMode = parseEnum(body.pointsMode, POINTS_MODES, 'pointsMode');

        for (const field of ['publicRegistration', 'registrationOpen'] as const) {
            if (body[field] !== undefined) {
                if (typeof body[field] !== 'boolean') throw new HttpError(400, `${field} must be a boolean`);
                data[field] = body[field];
            }
        }

        if (body.themeColor !== undefined) {
            const color = optionalString(body.themeColor, 'themeColor', { max: 20 });
            data.themeColor = color;
        }
        if (body.logoUrl !== undefined) {
            data.logoUrl = optionalString(body.logoUrl, 'logoUrl', { max: 500 });
        }

        if (body.scoringCriteria !== undefined) {
            const parsed = sanitizeCriteriaInput(body.scoringCriteria);
            if (parsed.error) throw new HttpError(400, parsed.error);
            data.scoringCriteria = parsed.criteria;
        }

        if (body.slug !== undefined) {
            const rawSlug = requiredString(body.slug, 'slug', { max: 60 });
            const slug = slugify(rawSlug);
            const existing = await prisma.competition.findFirst({
                where: { slug, id: { not: id } },
                select: { id: true },
            });
            if (existing) throw new HttpError(409, 'This competition slug is already in use');
            data.slug = slug;
        }

        try {
            const competition = await prisma.competition.update({
                where: { id },
                data,
                include: {
                    organization: { select: { id: true, name: true, slug: true, email: true } },
                    groups: {
                        include: { _count: { select: { participants: true, questions: true } } },
                        orderBy: { createdAt: 'asc' },
                    },
                    judgeAssignments: {
                        include: {
                            user: { select: { id: true, username: true, displayName: true, isActive: true } },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    liveState: true,
                    _count: { select: { participants: true, questions: true } },
                },
            });
            return NextResponse.json({
                ...competition,
                scoringCriteria: normalizeCriteria(competition.scoringCriteria),
            });
        } catch (error: unknown) {
            if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') {
                throw new HttpError(409, 'A competition with this name already exists for the organization');
            }
            throw error;
        }
    });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    return handleRoute(async () => {
        const { id } = await context.params;
        await requireCompetitionManager(id);
        await prisma.competition.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    });
}
