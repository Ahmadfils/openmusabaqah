import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import {
    handleRoute,
    HttpError,
    normalizeUsername,
    optionalString,
    readJson,
    requiredString,
    validatePassword,
} from '@/lib/http';
import { requireRole } from '@/lib/access';
import { uniqueOrganizationSlug, uniqueUsername } from '@/lib/identifiers';

function validateEmail(value: unknown, field: string): string {
    const email = requiredString(value, field, { max: 200 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, `Invalid ${field}`);
    return email;
}

export async function GET() {
    return handleRoute(async () => {
        await requireRole('SUPERADMIN');
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                country: true,
                city: true,
                isActive: true,
                createdAt: true,
                users: {
                    where: { role: 'ADMIN' },
                    select: { id: true, username: true, displayName: true, isActive: true },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { competitions: true, users: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(organizations);
    });
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        await requireRole('SUPERADMIN');
        const body = await readJson(request);

        const organizationName = requiredString(body.organizationName, 'organizationName', { min: 2, max: 120 });
        const organizationEmail = validateEmail(body.organizationEmail, 'organizationEmail');
        const organizationPhone = optionalString(body.organizationPhone, 'organizationPhone', { max: 40 });
        const country = optionalString(body.country, 'country', { max: 80 });
        const city = optionalString(body.city, 'city', { max: 80 });
        const address = optionalString(body.address, 'address', { max: 200 });

        const displayName = requiredString(body.displayName, 'displayName', { min: 2, max: 120 });
        const requestedUsername = optionalString(body.username, 'username', { max: 32 });
        const username = requestedUsername
            ? normalizeUsername(requestedUsername)
            : await uniqueUsername(body.adminEmail?.toString().split('@')[0] || organizationName);
        const password = validatePassword(body.password);

        const slug = await uniqueOrganizationSlug(organizationName);
        const existingEmail = await prisma.organization.findUnique({ where: { email: organizationEmail }, select: { id: true } });
        if (existingEmail) throw new HttpError(409, 'An organization with this email already exists');
        const existingUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (existingUsername) throw new HttpError(409, 'This username is already taken');

        try {
            const result = await prisma.$transaction(async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        name: organizationName,
                        slug,
                        email: organizationEmail,
                        phone: organizationPhone,
                        country,
                        city,
                        address,
                    },
                });
                const admin = await tx.user.create({
                    data: {
                        username,
                        passwordHash: hashPassword(password),
                        role: 'ADMIN',
                        displayName,
                        email: organizationEmail,
                        phone: organizationPhone,
                        organizationId: organization.id,
                    },
                });
                return { organization, admin };
            });
            return NextResponse.json(
                {
                    organization: result.organization,
                    admin: {
                        id: result.admin.id,
                        username: result.admin.username,
                        displayName: result.admin.displayName,
                    },
                },
                { status: 201 },
            );
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HttpError(409, 'Organization email or username already exists');
            }
            throw error;
        }
    });
}
