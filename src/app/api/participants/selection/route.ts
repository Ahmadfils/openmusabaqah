import { NextResponse } from 'next/server';

// In the new batch-based flow, batch selection is tracked via SystemState.currentBatchNumber.
// This endpoint is kept for backward compatibility but always returns no selection.
export async function GET() {
    return NextResponse.json({ selection: null });
}
