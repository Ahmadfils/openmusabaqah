import { NextResponse } from 'next/server';
import { handleRoute, HttpError, normalizeEmail, readJson, requestIp } from '@/lib/http';
import { assertNewsletterAllowed, recordNewsletterAttempt } from '@/lib/newsletter-rate-limit';
import { subscribeToNewsletter } from '@/lib/newsletter';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        if (body.consent !== true) {
            throw new HttpError(400, 'Please agree to receive the newsletter before subscribing');
        }

        const key = `subscribe:${requestIp(request)}`;
        assertNewsletterAllowed(key);
        recordNewsletterAttempt(key);

        const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 60) : 'landing_page';
        const result = await subscribeToNewsletter(email, source);

        return NextResponse.json({ ok: true, email: result.email, synced: result.synced });
    });
}
