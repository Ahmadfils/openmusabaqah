import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError } from '@/lib/http';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
    return handleRoute(async () => {
        const { slug } = await context.params;

        const competition = await prisma.competition.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                status: true,
                leaderboardVisibility: true,
                publicRegistration: true,
                registrationOpen: true,
                themeColor: true,
                logoUrl: true,
                organization: { select: { name: true, city: true, country: true, isActive: true } },
                groups: {
                    select: { id: true, name: true, description: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!competition || !competition.organization.isActive) {
            throw new HttpError(404, 'Competition not found');
        }

        const { organization, ...rest } = competition;
        return NextResponse.json({ ...rest, organization: { name: organization.name, city: organization.city, country: organization.country } });
    });
}
