#!/usr/bin/env node
/**
 * Copies the local OpenMusabaqa database into a cloud PostgreSQL database.
 *
 * Usage:
 *   node scripts/import-to-cloud.js --target="postgresql://..." [--source="postgresql://..."]
 *   node scripts/import-to-cloud.js --target="postgresql://..." --replace --yes
 *   node scripts/import-to-cloud.js --target="postgresql://..." --dry-run
 *
 * The source defaults to DATABASE_URL (or SOURCE_DATABASE_URL). Without --replace
 * existing rows are kept and duplicates are skipped. --replace wipes the target
 * tables first, then inserts the local rows with their original ids.
 */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const TABLES = [
    'organization',
    'user',
    'competition',
    'group',
    'question',
    'participant',
    'judgeAssignment',
    'judgeScore',
    'emailVerificationToken',
    'newsletterSubscriber',
    'emailLog',
    'cmsSection',
    'cmsHero',
    'cmsCta',
    'cmsMilestone',
    'cmsStat',
    'cmsTestimonial',
    'cmsTeamMember',
    'cmsGalleryItem',
    'cmsPartner',
    'liveState',
];

function loadEnv() {
    for (const file of ['.env.local', '.env']) {
        const envPath = path.join(process.cwd(), file);
        if (!fs.existsSync(envPath)) continue;
        for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
            const match = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (!match) continue;
            const [, key, rawValue] = match;
            if (process.env[key] !== undefined) continue;
            const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
            process.env[key] = value;
        }
    }
}

function getArg(name) {
    const prefix = `--${name}=`;
    const inline = process.argv.find((arg) => arg.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);
    const index = process.argv.indexOf(`--${name}`);
    if (index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
        return process.argv[index + 1];
    }
    return undefined;
}

function hasFlag(name) {
    return process.argv.includes(`--${name}`);
}

function describe(url) {
    try {
        const parsed = new URL(url);
        const database = parsed.pathname.replace(/^\//, '') || '(default)';
        return `${parsed.hostname}:${parsed.port || 5432}/${database}`;
    } catch {
        return '<invalid connection string>';
    }
}

function validate(url, label) {
    try {
        new URL(url);
    } catch {
        throw new Error(`${label} is not a valid PostgreSQL connection string.`);
    }
    if (!/^postgres(ql)?:/.test(url)) {
        throw new Error(`${label} must start with postgresql:// or postgres://.`);
    }
}

async function counts(client) {
    const result = {};
    for (const model of TABLES) {
        result[model] = await client[model].count();
    }
    return result;
}

async function copyTable(source, target, model, { replace, batchSize, dryRun }) {
    const rows = await source[model].findMany();
    if (dryRun || rows.length === 0) {
        return { source: rows.length, inserted: 0, target: await target[model].count() };
    }
    let inserted = 0;
    for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize);
        const result = await target[model].createMany({ data: batch, skipDuplicates: !replace });
        inserted += result.count;
    }
    const targetCount = await target[model].count();
    return { source: rows.length, inserted, target: targetCount };
}

async function wipeTarget(target) {
    for (const model of [...TABLES].reverse()) {
        await target[model].deleteMany();
    }
}

async function main() {
    if (hasFlag('help') || hasFlag('h')) {
        console.log(`Copies the local OpenMusabaqa database into a cloud PostgreSQL database.

Usage:
  node scripts/import-to-cloud.js --target="postgresql://..." [--source="postgresql://..."]
  node scripts/import-to-cloud.js --target="postgresql://..." --replace --yes
  node scripts/import-to-cloud.js --target="postgresql://..." --dry-run

Options:
  --source <url>      Source database (default: SOURCE_DATABASE_URL or DATABASE_URL)
  --target <url>      Target/cloud database (default: TARGET_DATABASE_URL)
  --replace           Wipe the target tables before inserting (requires --yes)
  --yes               Confirm the destructive --replace mode
  --dry-run           Report source and target row counts without writing
  --batch-size <n>    Rows per insert batch (default: 250)

Without --replace, existing rows are kept and duplicate ids are skipped.`);
        return;
    }

    loadEnv();

    const sourceUrl = getArg('source') || process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
    const targetUrl = getArg('target') || process.env.TARGET_DATABASE_URL;
    const replace = hasFlag('replace');
    const dryRun = hasFlag('dry-run');
    const batchSize = Number(getArg('batch-size')) || 250;

    if (!sourceUrl) throw new Error('Missing source. Pass --source="postgresql://..." or set DATABASE_URL.');
    if (!targetUrl) throw new Error('Missing target. Pass --target="postgresql://..." or set TARGET_DATABASE_URL.');
    validate(sourceUrl, 'Source');
    validate(targetUrl, 'Target');

    if (new URL(sourceUrl).hostname === new URL(targetUrl).hostname && sourceUrl === targetUrl) {
        throw new Error('Source and target are the same database; refusing to import.');
    }
    if (replace && !hasFlag('yes')) {
        throw new Error('--replace deletes every row in the target database. Re-run with --replace --yes.');
    }

    console.log(`Source: ${describe(sourceUrl)}`);
    console.log(`Target: ${describe(targetUrl)}`);
    console.log(`Mode:   ${dryRun ? 'dry run' : replace ? 'replace (target tables are wiped first)' : 'append (duplicates skipped)'}`);
    console.log('');

    const source = new PrismaClient({ datasourceUrl: sourceUrl });
    const target = new PrismaClient({ datasourceUrl: targetUrl });

    try {
        await source.$queryRawUnsafe('select 1');
        await target.$queryRawUnsafe('select 1');

        const targetBefore = await counts(target);
        const hasTargetData = Object.values(targetBefore).some((value) => value > 0);
        if (hasTargetData && !replace) {
            console.warn('Target already contains data. Existing rows are kept and conflicting ids are skipped.');
            console.warn('If the result is incomplete, re-run with --replace --yes to clone the local database.');
            console.log('');
        }
        if (replace && !dryRun) {
            await wipeTarget(target);
        }

        const results = {};
        for (const model of TABLES) {
            const result = await copyTable(source, target, model, { replace, batchSize, dryRun });
            results[model] = result;
            console.log(
                `${model.padEnd(24)} source=${String(result.source).padStart(5)} inserted=${String(result.inserted).padStart(5)} target=${String(result.target).padStart(5)}`,
            );
        }

        const mismatches = Object.entries(results).filter(([, result]) => result.source !== result.target);
        console.log('');
        if (dryRun) {
            console.log('Dry run complete. No rows were written.');
        } else if (mismatches.length === 0) {
            console.log('Import complete. Every table matches the source row count.');
        } else {
            console.warn('Import finished, but these tables differ from the source:');
            for (const [model, result] of mismatches) {
                console.warn(`  ${model}: source=${result.source} target=${result.target}`);
            }
            console.warn('Run with --replace --yes to force an exact copy.');
            process.exitCode = 1;
        }
    } finally {
        await source.$disconnect();
        await target.$disconnect();
    }
}

main().catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exitCode = 1;
});
