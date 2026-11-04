type Attempt = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const globalStore = globalThis as typeof globalThis & {
    __omLoginAttempts?: Map<string, Attempt>;
};

const attempts = globalStore.__omLoginAttempts ?? new Map<string, Attempt>();
globalStore.__omLoginAttempts = attempts;

export function assertLoginAllowed(key: string): void {
    const now = Date.now();
    const entry = attempts.get(key);
    if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
        const minutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
        throw new Error(`Too many login attempts. Try again in ${minutes} minute(s).`);
    }
}

export function recordLoginFailure(key: string): void {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return;
    }
    entry.count += 1;
}

export function clearLoginFailures(key: string): void {
    attempts.delete(key);
}
