import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';
import { handleRoute } from '@/lib/http';

export async function POST() {
    return handleRoute(async () => {
        await endSession();
        return NextResponse.json({ ok: true });
    });
}
