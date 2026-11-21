import 'server-only';

const API_BASE = 'https://api.brevo.com/v3';
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 400;

const apiKey = (process.env.BREVO_API_KEY || '').trim();
const fallbackSender = parseSender(process.env.EMAIL_FROM || 'OpenMusabaqa <no-reply@openmusabaqa.org>');
const senderEmail = (process.env.BREVO_SENDER_EMAIL || fallbackSender.email).trim();
const senderName = (process.env.BREVO_SENDER_NAME || fallbackSender.name || 'OpenMusabaqa').trim();
const configuredListId = Number(process.env.BREVO_NEWSLETTER_LIST_ID || process.env.BREVO_LIST_ID || 0);

export type BrevoResult = {
    ok: boolean;
    skipped?: boolean;
    status?: number;
    detail?: string;
};

export function isBrevoConfigured(): boolean {
    return Boolean(apiKey);
}

export function newsletterListId(): number {
    return Number.isFinite(configuredListId) && configuredListId > 0 ? configuredListId : 0;
}

export async function sendBrevoTransactional(input: {
    to: string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}): Promise<BrevoResult> {
    if (!apiKey) return { ok: false, skipped: true, detail: 'BREVO_API_KEY is not set' };

    try {
        const res = await brevoRequest('/smtp/email', {
            method: 'POST',
            body: JSON.stringify({
                sender: { email: senderEmail, name: senderName },
                to: input.to.map((email) => ({ email })),
                subject: input.subject,
                htmlContent: input.html,
                textContent: input.text,
                replyTo: input.replyTo ? { email: input.replyTo } : undefined,
            }),
        });
        if (!res.ok) return { ok: false, status: res.status, detail: await safeText(res) };
        return { ok: true, status: res.status };
    } catch (error) {
        return { ok: false, detail: error instanceof Error ? error.message : 'Brevo request failed' };
    }
}

export async function upsertBrevoContact(email: string): Promise<BrevoResult> {
    if (!apiKey) return { ok: false, skipped: true, detail: 'BREVO_API_KEY is not set' };

    const listIds = newsletterListId();
    const body = JSON.stringify({
        email,
        updateEnabled: true,
        listIds: listIds > 0 ? [listIds] : undefined,
    });

    try {
        let res = await requestWithRetry('/contacts', { method: 'POST', body });
        if (res.status === 400) {
            const detail = await safeText(res);
            if (!/duplicate|already exist|contact already/i.test(detail)) {
                return { ok: false, status: 400, detail };
            }
            res = await requestWithRetry(`/contacts/${encodeURIComponent(email)}`, {
                method: 'PUT',
                body: JSON.stringify({ email, listIds: listIds > 0 ? [listIds] : undefined }),
            });
        }
        if (!res.ok) return { ok: false, status: res.status, detail: await safeText(res) };
        return { ok: true, status: res.status };
    } catch (error) {
        return { ok: false, detail: error instanceof Error ? error.message : 'Brevo request failed' };
    }
}

export async function removeBrevoContactFromList(email: string): Promise<BrevoResult> {
    if (!apiKey) return { ok: false, skipped: true, detail: 'BREVO_API_KEY is not set' };
    const listId = newsletterListId();
    if (!listId) return { ok: false, skipped: true, detail: 'BREVO_NEWSLETTER_LIST_ID is not set' };

    try {
        const res = await requestWithRetry(`/contacts/${encodeURIComponent(email)}`, {
            method: 'PUT',
            body: JSON.stringify({ unlinkListIds: [listId] }),
        });
        if (res.status === 404) return { ok: true, status: 404 };
        if (!res.ok) return { ok: false, status: res.status, detail: await safeText(res) };
        return { ok: true, status: res.status };
    } catch (error) {
        return { ok: false, detail: error instanceof Error ? error.message : 'Brevo request failed' };
    }
}

async function requestWithRetry(path: string, init: RequestInit): Promise<Response> {
    try {
        const res = await brevoRequest(path, init);
        if (res.status === 429 || res.status >= 500) {
            await delay(RETRY_DELAY_MS);
            return await brevoRequest(path, init);
        }
        return res;
    } catch (error) {
        await delay(RETRY_DELAY_MS);
        try {
            return await brevoRequest(path, init);
        } catch {
            throw error;
        }
    }
}

async function brevoRequest(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(init.headers || {}),
            },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

function parseSender(value: string): { email: string; name?: string } {
    const match = value.match(/^(.*)<([^>]+)>$/);
    if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
    return { email: value.trim() };
}

async function safeText(res: Response): Promise<string> {
    try {
        return (await res.text()).slice(0, 500);
    } catch {
        return `HTTP ${res.status}`;
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
