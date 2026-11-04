import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword, homeForRole, startSession } from '@/lib/auth';
import {
    handleRoute,
    HttpError,
    normalizeUsername,
    optionalString,
    readJson,
    requiredString,
    validatePassword,
} from '@/lib/http';
import { uniqueOrganizationSlug, uniqueUsername } from '@/lib/identifiers';

function validateEmail(value: unknown): string {
    const email = requiredString(value, 'email', { max: 200 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid email address');
    return email;
}

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);

        const organizationName = requiredString(body.organizationName, 'organizationName', { min: 2, max: 120 });
        const organizationEmail = validateEmail(body.organizationEmail);
        const organizationPhone = optionalString(body.organizationPhone, 'organizationPhone', { max: 40 });
        const country = optionalString(body.country, 'country', { max: 80 });
        const city = optionalString(body.city, 'city', { max: 80 });
        const address = optionalString(body.address, 'address', { max: 200 });

        const password = validatePassword(body.password);
        const displayName = optionalString(body.displayName, 'displayName', { max: 120 }) ?? `${organizationName} Admin`;
        const requestedUsername = optionalString(body.username, 'username', { max: 32 });
        const username = requestedUsername
            ? normalizeUsername(requestedUsername)
            : await uniqueUsername(organizationEmail.split('@')[0] || organizationName);

        const slug = await uniqueOrganizationSlug(organizationName);

        const existingEmail = await prisma.organization.findUnique({
            where: { email: organizationEmail },
            select: { id: true },
        });
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

            await startSession(result.admin);
            return NextResponse.json({
                organization: {
                    id: result.organization.id,
                    name: result.organization.name,
                    slug: result.organization.slug,
                },
                user: {
                    id: result.admin.id,
                    username: result.admin.username,
                    role: result.admin.role,
                    displayName: result.admin.displayName,
                },
                redirectTo: homeForRole(result.admin.role),
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HttpError(409, 'Organization email or username already exists');
            }
            throw error;
        }
    });
}
