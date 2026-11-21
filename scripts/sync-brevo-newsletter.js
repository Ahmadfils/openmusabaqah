#!/usr/bin/env node
/**
 * Re-syncs newsletter subscribers whose Brevo contact sync failed.
 *
 * Usage:
 *   npm run brevo:sync-newsletter            # ACTIVE subscribers with syncedBrevo=false
 *   npm run brevo:sync-newsletter -- --all   # every ACTIVE subscriber (idempotent)
 */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'https://api.brevo.com/v3';

function loadEnv() {
    for (const file of ['.env.local', '.env']) {
        const envPath = path.join(process.cwd(), file);
        if (!fs.existsSync(envPath)) continue;
        for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
            const match = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (!match) continue;
            const [, key, rawValue] = match;
            if (process.env[key] !== undefined) continue;
            process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
        }
    }
}

async function brevoRequest(pathname, init) {
    const res = await fetch(`${API_BASE}${pathname}`, {
        ...init,
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    return res;
}

async function upsertContact(email, listId) {
    try {
        await brevoRequest('/contacts', {
            method: 'POST',
            body: JSON.stringify({ email, updateEnabled: true, listIds: listId > 0 ? [listId] : undefined }),
        });
    } catch (error) {
        if (!/duplicate|already exist|contact already/i.test(error.message)) throw error;
        await brevoRequest(`/contacts/${encodeURIComponent(email)}`, {
            method: 'PUT',
            body: JSON.stringify({ email, listIds: listId > 0 ? [listId] : undefined }),
        });
    }
}

async function main() {
    loadEnv();

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error('BREVO_API_KEY is not set.');

    const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID || process.env.BREVO_LIST_ID || 0);
    const syncAll = process.argv.includes('--all');
    const prisma = new PrismaClient();

    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            where: { status: 'ACTIVE', ...(syncAll ? {} : { syncedBrevo: false }) },
            orderBy: { subscribedAt: 'asc' },
        });

        console.log(`Syncing ${subscribers.length} subscriber(s) to Brevo${listId > 0 ? ` list ${listId}` : ''}...`);
        let synced = 0;
        let failed = 0;

        for (const subscriber of subscribers) {
            try {
                await upsertContact(subscriber.email, listId);
                await prisma.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { syncedBrevo: true } });
                synced += 1;
            } catch (error) {
                failed += 1;
                console.error(`  failed ${subscriber.id}: ${error.message}`);
            }
        }

        console.log(`Done. synced=${synced} failed=${failed}`);
        if (failed > 0) process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(`Sync failed: ${error.message}`);
    process.exitCode = 1;
});
