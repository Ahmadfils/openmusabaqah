import { NextResponse } from 'next/server';
import { handleRoute, HttpError, normalizeEmail, optionalString, readJson, requestIp } from '@/lib/http';
import { assertNewsletterAllowed, recordNewsletterAttempt } from '@/lib/newsletter-rate-limit';
import { isValidUnsubscribeToken, unsubscribeFromNewsletter } from '@/lib/newsletter';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        const token = optionalString(body.token, 'token', { max: 200 });

        if (token) {
            if (!isValidUnsubscribeToken(email, token)) {
                throw new HttpError(400, 'This unsubscribe link is invalid');
            }
        } else {
            const key = `unsubscribe:${requestIp(request)}`;
            assertNewsletterAllowed(key);
            recordNewsletterAttempt(key);
        }

        const result = await unsubscribeFromNewsletter(email);
        return NextResponse.json({ ok: true, brevoRemoved: result.removedFromBrevo });
    });
}
