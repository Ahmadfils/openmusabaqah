import 'server-only';

import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { SessionUser } from '@/lib/types';

export const SESSION_COOKIE = 'om_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const SCRYPT_KEYLEN = 64;

function sessionSecret(): string {
    const secret = process.env.AUTH_SECRET;
    if (secret && secret.length >= 16) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('AUTH_SECRET must be set to at least 16 characters in production');
    }
    return 'openmusabaqah-development-secret-change-me';
}

function signature(payload: string): string {
    return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16);
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    try {
        const derived = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN);
        return crypto.timingSafeEqual(derived, Buffer.from(hashHex, 'hex'));
    } catch {
        return false;
    }
}

export function generatePassword(length = 14): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.randomBytes(length);
    let value = '';
    for (let i = 0; i < length; i += 1) value += alphabet[bytes[i] % alphabet.length];
    return value;
}

type TokenPayload = {
    uid: string;
    sv: number;
    exp: number;
};

function createToken(user: { id: string; sessionVersion: number }): string {
    const payload: TokenPayload = {
        uid: user.id,
        sv: user.sessionVersion,
        exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${signature(encoded)}`;
}

function readToken(token: string): TokenPayload | null {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig || !safeEqual(signature(encoded), sig)) return null;
    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
        if (!payload.uid || typeof payload.sv !== 'number' || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

export async function startSession(user: { id: string; sessionVersion: number }): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, createToken(user), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
}

export async function endSession(): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
}

export async function getSession(): Promise<SessionUser | null> {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = readToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.uid },
        select: {
            id: true,
            username: true,
            role: true,
            displayName: true,
            organizationId: true,
            isActive: true,
            sessionVersion: true,
            organization: { select: { isActive: true } },
        },
    });

    if (!user || !user.isActive || user.sessionVersion !== payload.sv) return null;
    if (user.role !== 'SUPERADMIN' && (!user.organizationId || !user.organization?.isActive)) return null;

    return {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        organizationId: user.organizationId,
        sessionVersion: user.sessionVersion,
    };
}

export function homeForRole(role: SessionUser['role']): string {
    if (role === 'SUPERADMIN') return '/superadmin';
    if (role === 'ADMIN') return '/admin';
    return '/judge';
}
