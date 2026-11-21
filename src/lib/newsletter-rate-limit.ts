import { HttpError } from '@/lib/http';

type Attempt = { count: number; resetAt: number };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const globalStore = globalThis as typeof globalThis & {
    __omNewsletterAttempts?: Map<string, Attempt>;
};

const attempts = globalStore.__omNewsletterAttempts ?? new Map<string, Attempt>();
globalStore.__omNewsletterAttempts = attempts;

export function assertNewsletterAllowed(key: string): void {
    const now = Date.now();
    const entry = attempts.get(key);
    if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
        const minutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
        throw new HttpError(429, `Too many requests. Try again in ${minutes} minute(s).`);
    }
}

export function recordNewsletterAttempt(key: string): void {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return;
    }
    entry.count += 1;
}
