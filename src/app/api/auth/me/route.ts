import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { handleRoute } from '@/lib/http';

export async function GET() {
    return handleRoute(async () => {
        const user = await getSession();
        return NextResponse.json({ user });
    });
}
