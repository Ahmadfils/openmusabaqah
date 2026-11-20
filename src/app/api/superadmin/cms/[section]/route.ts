import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleRoute, HttpError, optionalInt, optionalString, readJson, requiredString } from '@/lib/http';
import { requireRole } from '@/lib/access';
import { CMS_SECTIONS } from '@/lib/cms-types';
import { getLandingContent } from '@/lib/cms';

const CMS_KEYS = ['sections', 'hero', 'cta', 'milestones', 'stats', 'testimonials', 'team', 'gallery', 'partners'] as const;
type CmsApiSection = (typeof CMS_KEYS)[number];

const SECTION_META = new Map<string, (typeof CMS_SECTIONS)[number]>(
    CMS_SECTIONS.map((section) => [section.key, section]),
);

type Context = { params: Promise<{ section: string }> };

export async function GET(_request: Request, context: Context) {
    return handleRoute(async () => {
        await requireRole('SUPERADMIN');
        const section = parseSection((await context.params).section);

        if (section === 'sections') {
            const rows = await prisma.cmsSection.findMany();
            const byKey = new Map(rows.map((row) => [row.key, row]));
            const items = CMS_SECTIONS.map((meta) => {
                const row = byKey.get(meta.key);
                return {
                    key: meta.key,
                    label: meta.label,
                    description: meta.description,
                    order: row?.order ?? meta.order,
                    enabled: row?.enabled ?? true,
                };
            }).sort((a, b) => a.order - b.order);
            return NextResponse.json({ items });
        }

        const content = await getLandingContent();
        switch (section) {
            case 'hero': {
                const hero = await prisma.cmsHero.findUnique({ where: { id: 'default' } });
                return NextResponse.json({ ...content.hero, whatsappUrl: hero?.whatsappUrl ?? null });
            }
            case 'cta':
                return NextResponse.json(content.cta);
            case 'milestones':
                return NextResponse.json({ items: content.milestones });
            case 'stats':
                return NextResponse.json({ items: content.stats });
            case 'testimonials':
                return NextResponse.json({ items: content.testimonials });
            case 'team':
                return NextResponse.json({ items: content.team });
            case 'gallery':
                return NextResponse.json({ items: content.gallery });
            case 'partners':
                return NextResponse.json({ items: content.partners });
        }
    });
}

export async function PUT(request: Request, context: Context) {
    return handleRoute(async () => {
        await requireRole('SUPERADMIN');
        const section = parseSection((await context.params).section);
        const body = (await readJson(request)) as Record<string, unknown>;

        switch (section) {
            case 'sections': {
                const items = expectItems(body.items);
                const data = items.map((item, index) => {
                    const key = requiredString(item.key, 'key', { max: 40 });
                    const meta = SECTION_META.get(key);
                    if (!meta) throw new HttpError(400, `Unknown section key: ${key}`);
                    return {
                        key: meta.key,
                        label: meta.label,
                        enabled: booleanValue(item.enabled, 'enabled', true),
                        order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                    };
                });

                await prisma.$transaction(
                    data.map((row) =>
                        prisma.cmsSection.upsert({
                            where: { key: row.key },
                            update: { enabled: row.enabled, order: row.order, label: row.label },
                            create: row,
                        }),
                    ),
                );
                break;
            }

            case 'hero': {
                const data = {
                    badge: optionalString(body.badge, 'badge', { max: 160 }),
                    title: requiredString(body.title, 'title', { min: 2, max: 200 }),
                    subtitle: requiredString(body.subtitle, 'subtitle', { min: 2, max: 600 }),
                    primaryCta: requiredString(body.primaryCta, 'primaryCta', { min: 1, max: 80 }),
                    primaryLink: requiredString(body.primaryLink, 'primaryLink', { min: 1, max: 300 }),
                    secondaryCta: optionalString(body.secondaryCta, 'secondaryCta', { max: 80 }),
                    secondaryLink: optionalString(body.secondaryLink, 'secondaryLink', { max: 300 }),
                    imageUrl: optionalString(body.imageUrl, 'imageUrl', { max: 500 }),
                    whatsappUrl: optionalString(body.whatsappUrl, 'whatsappUrl', { max: 500 }),
                };
                await prisma.cmsHero.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
                break;
            }

            case 'cta': {
                const data = {
                    title: requiredString(body.title, 'title', { min: 2, max: 200 }),
                    description: requiredString(body.description, 'description', { min: 2, max: 800 }),
                    primaryCta: requiredString(body.primaryCta, 'primaryCta', { min: 1, max: 80 }),
                    primaryLink: requiredString(body.primaryLink, 'primaryLink', { min: 1, max: 300 }),
                    secondaryCta: optionalString(body.secondaryCta, 'secondaryCta', { max: 80 }),
                    secondaryLink: optionalString(body.secondaryLink, 'secondaryLink', { max: 300 }),
                };
                await prisma.cmsCta.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
                break;
            }

            case 'milestones': {
                const rows = expectItems(body.items).map((item, index) => ({
                    year: requiredString(item.year, 'year', { min: 1, max: 20 }),
                    title: requiredString(item.title, 'title', { min: 1, max: 160 }),
                    description: requiredString(item.description, 'description', { min: 1, max: 800 }),
                    order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                }));
                await replaceList(rows, () => prisma.cmsMilestone.deleteMany(), (data) => prisma.cmsMilestone.createMany({ data }));
                break;
            }

            case 'stats': {
                const rows = expectItems(body.items).map((item, index) => ({
                    label: requiredString(item.label, 'label', { min: 1, max: 80 }),
                    value: requiredString(item.value, 'value', { min: 1, max: 40 }),
                    suffix: optionalString(item.suffix, 'suffix', { max: 20 }),
                    icon: optionalString(item.icon, 'icon', { max: 40 }),
                    order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                }));
                await replaceList(rows, () => prisma.cmsStat.deleteMany(), (data) => prisma.cmsStat.createMany({ data }));
                break;
            }

            case 'testimonials': {
                const rows = expectItems(body.items).map((item, index) => ({
                    name: requiredString(item.name, 'name', { min: 1, max: 120 }),
                    role: requiredString(item.role, 'role', { min: 1, max: 160 }),
                    avatarUrl: optionalString(item.avatarUrl, 'avatarUrl', { max: 500 }),
                    quote: requiredString(item.quote, 'quote', { min: 1, max: 1200 }),
                    rating: optionalInt(item.rating, 'rating', { min: 1, max: 5 }) ?? 5,
                    order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                }));
                await replaceList(rows, () => prisma.cmsTestimonial.deleteMany(), (data) => prisma.cmsTestimonial.createMany({ data }));
                break;
            }

            case 'team': {
                const rows = expectItems(body.items).map((item, index) => ({
                    name: requiredString(item.name, 'name', { min: 1, max: 120 }),
                    role: requiredString(item.role, 'role', { min: 1, max: 160 }),
                    bio: requiredString(item.bio, 'bio', { min: 1, max: 900 }),
                    avatarUrl: optionalString(item.avatarUrl, 'avatarUrl', { max: 500 }),
                    twitter: optionalString(item.twitter, 'twitter', { max: 300 }),
                    linkedin: optionalString(item.linkedin, 'linkedin', { max: 300 }),
                    order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                }));
                await replaceList(rows, () => prisma.cmsTeamMember.deleteMany(), (data) => prisma.cmsTeamMember.createMany({ data }));
                break;
            }

            case 'gallery': {
                const rows = expectItems(body.items).map((item, index) => ({
                    title: requiredString(item.title, 'title', { min: 1, max: 160 }),
                    caption: optionalString(item.caption, 'caption', { max: 400 }),
                    imageUrl: requiredString(item.imageUrl, 'imageUrl', { min: 1, max: 600 }),
                    featured: booleanValue(item.featured, 'featured', false),
                    order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                }));
                await replaceList(rows, () => prisma.cmsGalleryItem.deleteMany(), (data) => prisma.cmsGalleryItem.createMany({ data }));
                break;
            }

            case 'partners': {
                const rows = expectItems(body.items).map((item, index) => {
                    const tier = optionalString(item.tier, 'tier', { max: 20 }) ?? 'partner';
                    return {
                        name: requiredString(item.name, 'name', { min: 1, max: 160 }),
                        logoUrl: optionalString(item.logoUrl, 'logoUrl', { max: 600 }),
                        website: optionalString(item.website, 'website', { max: 600 }),
                        tier: ['gold', 'silver', 'partner'].includes(tier) ? tier : 'partner',
                        order: optionalInt(item.order, 'order', { min: 0, max: 999 }) ?? index + 1,
                    };
                });
                await replaceList(rows, () => prisma.cmsPartner.deleteMany(), (data) => prisma.cmsPartner.createMany({ data }));
                break;
            }
        }

        return NextResponse.json({ ok: true });
    });
}

function parseSection(value: string): CmsApiSection {
    if (!(CMS_KEYS as readonly string[]).includes(value)) throw new HttpError(404, 'Unknown CMS section');
    return value as CmsApiSection;
}

function expectItems(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) throw new HttpError(400, 'items must be an array');
    if (value.length > 60) throw new HttpError(400, 'Too many items (maximum 60)');
    return value.map((item) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            throw new HttpError(400, 'Each item must be an object');
        }
        return item as Record<string, unknown>;
    });
}

function booleanValue(value: unknown, field: string, fallback: boolean): boolean {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== 'boolean') throw new HttpError(400, `${field} must be a boolean`);
    return value;
}

async function replaceList<T>(
    rows: T[],
    remove: () => Prisma.PrismaPromise<unknown>,
    createMany: (data: T[]) => Prisma.PrismaPromise<unknown>,
) {
    await prisma.$transaction([remove(), ...(rows.length ? [createMany(rows)] : [])]);
}
