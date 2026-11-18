import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, readJson, requiredString } from '@/lib/http';
import { issueVerificationToken } from '@/lib/verification';
import { sendVerificationEmail, shouldExposeDevLinks, verificationUrl } from '@/lib/email';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const email = requiredString(body.email, 'email', { max: 200 }).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid email address');

        const organization = await prisma.organization.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, isVerified: true },
        });

        // Always answer with the same payload so the endpoint cannot be used to enumerate organizations.
        if (!organization || organization.isVerified) {
            return NextResponse.json({ ok: true, sent: false });
        }

        const token = await issueVerificationToken(organization);
        const result = await sendVerificationEmail({
            to: organization.email,
            organizationName: organization.name,
            token,
        });

        return NextResponse.json({
            ok: true,
            sent: result.ok && !result.skipped,
            verificationUrl: shouldExposeDevLinks() ? verificationUrl(token) : undefined,
        });
    });
}
