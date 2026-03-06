import { NextResponse } from 'next/server';

// In the new batch-based flow, participants select a batch number via /api/state directly.
// This endpoint is kept for backward compatibility but is a no-op.
export async function POST() {
    return NextResponse.json({ ok: true });
}
