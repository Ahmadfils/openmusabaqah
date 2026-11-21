import 'server-only';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { appUrl } from '@/lib/app-url';
import { removeBrevoContactFromList, upsertBrevoContact } from '@/lib/brevo';

const tokenSecret = process.env.AUTH_SECRET || '';

export async function subscribeToNewsletter(email: string, source: string): Promise<{ email: string; synced: boolean }> {
    const now = new Date();
    const subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { status: 'ACTIVE', source, consentedAt: now, unsubscribedAt: null },
        create: { email, source, status: 'ACTIVE', consentedAt: now },
    });

    const sync = await upsertBrevoContact(email);
    if (sync.ok) {
        await prisma.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { syncedBrevo: true } });
        return { email: subscriber.email, synced: true };
    }

    if (!sync.skipped) {
        console.warn('Brevo newsletter sync failed', {
            status: sync.status,
            detail: sync.detail?.slice(0, 200),
        });
    }
    return { email: subscriber.email, synced: false };
}

export async function unsubscribeFromNewsletter(email: string): Promise<{ removedFromBrevo: boolean }> {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } });
    if (!existing) return { removedFromBrevo: false };

    await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    });

    const removal = await removeBrevoContactFromList(email);
    if (!removal.ok && !removal.skipped) {
        console.warn('Brevo unsubscribe sync failed', {
            status: removal.status,
            detail: removal.detail?.slice(0, 200),
        });
    }
    return { removedFromBrevo: removal.ok };
}

export async function listActiveNewsletterEmails(): Promise<string[]> {
    const rows = await prisma.newsletterSubscriber.findMany({
        where: { status: 'ACTIVE' },
        select: { email: true },
        orderBy: { subscribedAt: 'asc' },
    });
    return rows.map((row) => row.email);
}

export function unsubscribeToken(email: string): string {
    if (!tokenSecret) throw new Error('AUTH_SECRET is required to sign unsubscribe links');
    return crypto.createHmac('sha256', tokenSecret).update(email.trim().toLowerCase()).digest('base64url');
}

export function isValidUnsubscribeToken(email: string, token: string): boolean {
    if (!tokenSecret) return false;
    const expected = Buffer.from(unsubscribeToken(email));
    const provided = Buffer.from(token);
    return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

export function unsubscribeUrl(email: string): string {
    return `${appUrl()}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken(email))}`;
}
