import { NextResponse } from 'next/server';
import { handleRoute, HttpError, readJson, requiredString } from '@/lib/http';
import { consumeVerificationToken } from '@/lib/verification';

export async function POST(request: Request) {
    return handleRoute(async () => {
        const body = await readJson(request);
        const token = requiredString(body.token, 'token', { max: 200 });

        const result = await consumeVerificationToken(token);
        if (!result) {
            throw new HttpError(400, 'This verification link is invalid, already used, or has expired.');
        }

        return NextResponse.json({
            ok: true,
            organizationId: result.organizationId,
            redirectTo: '/login?verified=1',
        });
    });
}
