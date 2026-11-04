import 'server-only';

import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/http';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRegistrationCode(): string {
    const bytes = crypto.randomBytes(8);
    let value = '';
    for (let i = 0; i < bytes.length; i += 1) value += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    return `OM-${value}`;
}

export async function uniqueRegistrationCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = generateRegistrationCode();
        const existing = await prisma.participant.findUnique({ where: { registrationCode: code }, select: { id: true } });
        if (!existing) return code;
    }
    throw new Error('Could not generate a unique registration code');
}

export async function uniqueCompetitionSlug(input: string): Promise<string> {
    const base = slugify(input);
    let candidate = base;
    for (let suffix = 2; suffix < 200; suffix += 1) {
        const existing = await prisma.competition.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!existing) return candidate;
        candidate = `${base}-${suffix}`;
    }
    throw new Error('Could not generate a unique competition slug');
}

export async function uniqueOrganizationSlug(input: string): Promise<string> {
    const base = slugify(input);
    let candidate = base;
    for (let suffix = 2; suffix < 200; suffix += 1) {
        const existing = await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!existing) return candidate;
        candidate = `${base}-${suffix}`;
    }
    throw new Error('Could not generate a unique organization slug');
}

export async function uniqueUsername(base: string): Promise<string> {
    const cleaned = slugify(base).replace(/-/g, '.').slice(0, 24) || 'judge';
    let candidate = cleaned;
    for (let suffix = 2; suffix < 500; suffix += 1) {
        const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
        if (!existing) return candidate;
        candidate = `${cleaned}${suffix}`;
    }
    throw new Error('Could not generate a unique username');
}
