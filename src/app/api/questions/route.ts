import { NextResponse } from 'next/server';
import { QUESTIONS } from '@/lib/store';

export async function GET() {
    return NextResponse.json(QUESTIONS);
}
