import { NextResponse } from 'next/server';

export class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function handleRoute(handler: () => Promise<Response>): Promise<Response> {
    try {
        return await handler();
    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Unhandled API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
    try {
        return (await request.json()) as T;
    } catch {
        throw new HttpError(400, 'Invalid JSON body');
    }
}

export function requiredString(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpError(400, `${field} is required`);
    }
    const trimmed = value.trim();
    if (options.min && trimmed.length < options.min) {
        throw new HttpError(400, `${field} must be at least ${options.min} characters`);
    }
    if (options.max && trimmed.length > options.max) {
        throw new HttpError(400, `${field} must be at most ${options.max} characters`);
    }
    return trimmed;
}

export function optionalString(
    value: unknown,
    field: string,
    options: { max?: number } = {},
): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') throw new HttpError(400, `${field} must be a string`);
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (options.max && trimmed.length > options.max) {
        throw new HttpError(400, `${field} must be at most ${options.max} characters`);
    }
    return trimmed;
}

export function optionalInt(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new HttpError(400, `${field} must be an integer`);
    if (options.min !== undefined && parsed < options.min) {
        throw new HttpError(400, `${field} must be at least ${options.min}`);
    }
    if (options.max !== undefined && parsed > options.max) {
        throw new HttpError(400, `${field} must be at most ${options.max}`);
    }
    return parsed;
}

export function requiredInt(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number {
    const parsed = optionalInt(value, field, options);
    if (parsed === null) throw new HttpError(400, `${field} is required`);
    return parsed;
}

export function optionalFloat(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new HttpError(400, `${field} must be a number`);
    if (options.min !== undefined && parsed < options.min) {
        throw new HttpError(400, `${field} must be at least ${options.min}`);
    }
    if (options.max !== undefined && parsed > options.max) {
        throw new HttpError(400, `${field} must be at most ${options.max}`);
    }
    return parsed;
}

export function normalizeUsername(value: unknown): string {
    const username = requiredString(value, 'username', { min: 3, max: 32 }).toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(username)) {
        throw new HttpError(400, 'username may only contain letters, numbers, dots, underscores and dashes');
    }
    return username;
}

export function validatePassword(value: unknown): string {
    const password = requiredString(value, 'password', { min: 8, max: 128 });
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        throw new HttpError(400, 'password must contain at least one letter and one number');
    }
    return password;
}

export function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'competition';
}
