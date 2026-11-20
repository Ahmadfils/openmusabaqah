import { NextResponse } from 'next/server';
import { handleRoute, HttpError, readJson, requiredString } from '@/lib/http';
import { subscribeToNewsletter } from '@/lib/email';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const email = requiredString(body.email, 'email', { max: 200 }).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');

        const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 60) : 'landing_page';
        const subscriber = await subscribeToNewsletter(email, source);

        return NextResponse.json({ ok: true, email: subscriber.email });
    });
}
