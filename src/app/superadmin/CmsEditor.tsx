'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api, errorMessage, put } from '@/lib/client-api';

type ListKey = 'milestones' | 'stats' | 'testimonials' | 'team' | 'gallery' | 'partners';
type EditorKey = 'sections' | 'hero' | 'cta' | ListKey;
type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select';

type FieldDef = {
    key: string;
    label: string;
    type?: FieldType;
    options?: string[];
    placeholder?: string;
    wide?: boolean;
};

const LIST_KEYS: ListKey[] = ['milestones', 'stats', 'testimonials', 'team', 'gallery', 'partners'];

const TABS: { key: EditorKey; label: string }[] = [
    { key: 'sections', label: 'Sections' },
    { key: 'hero', label: 'Hero' },
    { key: 'cta', label: 'Call to action' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'stats', label: 'Statistics' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'team', label: 'Team' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'partners', label: 'Partners' },
];

const HERO_FIELDS: FieldDef[] = [
    { key: 'title', label: 'Headline', wide: true },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea', wide: true },
    { key: 'primaryCta', label: 'Registration button label' },
    { key: 'primaryLink', label: 'Registration button link', placeholder: '/signup' },
    { key: 'whatsappUrl', label: 'WhatsApp link (leave empty to hide the button)', wide: true, placeholder: 'https://wa.me/253...' },
];

const CTA_FIELDS: FieldDef[] = [
    { key: 'title', label: 'Headline', wide: true },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
    { key: 'primaryCta', label: 'Primary button label' },
    { key: 'primaryLink', label: 'Primary button link' },
    { key: 'secondaryCta', label: 'Secondary button label' },
    { key: 'secondaryLink', label: 'Secondary button link' },
];

const LIST_FIELDS: Record<ListKey, FieldDef[]> = {
    milestones: [
        { key: 'year', label: 'Year', placeholder: '2026' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
    stats: [
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value', placeholder: '4,800' },
        { key: 'suffix', label: 'Suffix', placeholder: '+' },
        { key: 'icon', label: 'Icon', type: 'select', options: ['trophy', 'users', 'book', 'building'] },
    ],
    testimonials: [
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'avatarUrl', label: 'Avatar URL' },
        { key: 'rating', label: 'Rating (1-5)', type: 'number' },
        { key: 'quote', label: 'Quote', type: 'textarea', wide: true },
    ],
    team: [
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'avatarUrl', label: 'Avatar URL' },
        { key: 'twitter', label: 'Twitter / X URL' },
        { key: 'linkedin', label: 'LinkedIn URL' },
        { key: 'bio', label: 'Bio', type: 'textarea', wide: true },
    ],
    gallery: [
        { key: 'title', label: 'Title' },
        { key: 'imageUrl', label: 'Image URL', placeholder: '/gallery/gallery-1.svg' },
        { key: 'caption', label: 'Caption', type: 'textarea', wide: true },
        { key: 'featured', label: 'Featured (large tile)', type: 'checkbox' },
    ],
    partners: [
        { key: 'name', label: 'Name' },
        { key: 'tier', label: 'Tier', type: 'select', options: ['gold', 'silver', 'partner'] },
        { key: 'logoUrl', label: 'Logo URL' },
        { key: 'website', label: 'Website URL' },
    ],
};

function blankItem(section: ListKey): Record<string, unknown> {
    switch (section) {
        case 'milestones':
            return { year: '', title: '', description: '' };
        case 'stats':
            return { label: '', value: '', suffix: '', icon: 'trophy' };
        case 'testimonials':
            return { name: '', role: '', quote: '', rating: 5, avatarUrl: '' };
        case 'team':
            return { name: '', role: '', bio: '', avatarUrl: '', twitter: '', linkedin: '' };
        case 'gallery':
            return { title: '', caption: '', imageUrl: '', featured: false };
        case 'partners':
            return { name: '', logoUrl: '', website: '', tier: 'partner' };
    }
}

export default function CmsEditor() {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [tab, setTab] = useState<EditorKey>('sections');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [sections, hero, cta, ...lists] = await Promise.all([
                api<{ items: any[] }>('/api/superadmin/cms/sections'),
                api<any>('/api/superadmin/cms/hero'),
                api<any>('/api/superadmin/cms/cta'),
                ...LIST_KEYS.map((key) => api<{ items: any[] }>(`/api/superadmin/cms/${key}`)),
            ]);
            const next: Record<string, any> = { sections: sections.items, hero, cta };
            LIST_KEYS.forEach((key, index) => {
                next[key] = lists[index].items;
            });
            setData(next);
            setError('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const update = (updater: (draft: Record<string, any>) => void) => {
        setData((current) => {
            if (!current) return current;
            const draft = structuredClone(current);
            updater(draft);
            return draft;
        });
    };

    const save = async () => {
        if (!data) return;
        setSaving(true);
        setError('');
        setNotice('');
        try {
            if (tab === 'sections') {
                await put('/api/superadmin/cms/sections', {
                    items: data.sections.map((section: any, index: number) => ({ ...section, order: index + 1 })),
                });
            } else if (tab === 'hero' || tab === 'cta') {
                await put(`/api/superadmin/cms/${tab}`, data[tab]);
            } else {
                await put(`/api/superadmin/cms/${tab}`, {
                    items: data[tab].map((item: any, index: number) => ({ ...item, order: index + 1 })),
                });
            }
            setNotice('Saved. The landing page reflects the change on the next load.');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const switchTab = (next: EditorKey) => {
        setTab(next);
        setNotice('');
        setError('');
    };

    const moveItem = (section: ListKey, index: number, direction: -1 | 1) => {
        update((draft) => {
            const items = draft[section];
            const target = index + direction;
            if (target < 0 || target >= items.length) return;
            [items[index], items[target]] = [items[target], items[index]];
        });
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        update((draft) => {
            const sections = draft.sections;
            const target = index + direction;
            if (target < 0 || target >= sections.length) return;
            [sections[index], sections[target]] = [sections[target], sections[index]];
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-gold-500" size={32} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="glass-card p-10 text-center text-sm text-turquoise-500">
                {error || 'Unable to load landing page content.'}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
            {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}

            <div className="flex flex-wrap gap-2">
                {TABS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => switchTab(item.key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            tab === item.key
                                ? 'border-gold-500/50 bg-gold-500/15 text-gold-200'
                                : 'border-white/10 text-turquoise-400 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="glass-card p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">{TABS.find((item) => item.key === tab)?.label}</h2>
                        <p className="text-xs text-turquoise-500">
                            {tab === 'sections'
                                ? 'Toggle visibility and reorder the landing page sections.'
                                : 'Changes are published to the public landing page when saved.'}
                        </p>
                    </div>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="btn-gold flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
                    </button>
                </div>

                {tab === 'sections' && (
                    <div className="space-y-2">
                        {data.sections.map((section: any, index: number) => (
                            <div key={section.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                <span className="w-6 text-xs font-bold text-turquoise-500">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-white">{section.label}</p>
                                    <p className="truncate text-[11px] text-turquoise-500">{section.description}</p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-turquoise-300">
                                    <input
                                        type="checkbox"
                                        checked={section.enabled}
                                        onChange={(event) =>
                                            update((draft) => {
                                                draft.sections[index].enabled = event.target.checked;
                                            })
                                        }
                                        className="h-4 w-4 accent-amber-500"
                                    />
                                    Visible
                                </label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveSection(index, -1)}
                                        disabled={index === 0}
                                        className="rounded-lg border border-white/10 p-1.5 text-turquoise-400 hover:bg-white/10 disabled:opacity-30"
                                        title="Move up"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => moveSection(index, 1)}
                                        disabled={index === data.sections.length - 1}
                                        className="rounded-lg border border-white/10 p-1.5 text-turquoise-400 hover:bg-white/10 disabled:opacity-30"
                                        title="Move down"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(tab === 'hero' || tab === 'cta') && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {(tab === 'hero' ? HERO_FIELDS : CTA_FIELDS).map((field) => (
                            <Field
                                key={field.key}
                                field={field}
                                value={data[tab][field.key]}
                                onChange={(value) =>
                                    update((draft) => {
                                        draft[tab][field.key] = value;
                                    })
                                }
                            />
                        ))}
                    </div>
                )}

                {LIST_KEYS.includes(tab as ListKey) && (
                    <ListEditor
                        section={tab as ListKey}
                        items={data[tab]}
                        onChange={(index, key, value) =>
                            update((draft) => {
                                draft[tab][index][key] = value;
                            })
                        }
                        onMove={(index, direction) => moveItem(tab as ListKey, index, direction)}
                        onRemove={(index) =>
                            update((draft) => {
                                draft[tab].splice(index, 1);
                            })
                        }
                        onAdd={() =>
                            update((draft) => {
                                draft[tab].push(blankItem(tab as ListKey));
                            })
                        }
                    />
                )}
            </div>
        </div>
    );
}

function ListEditor({
    section,
    items,
    onChange,
    onMove,
    onRemove,
    onAdd,
}: {
    section: ListKey;
    items: any[];
    onChange: (index: number, key: string, value: unknown) => void;
    onMove: (index: number, direction: -1 | 1) => void;
    onRemove: (index: number) => void;
    onAdd: () => void;
}) {
    const fields = LIST_FIELDS[section];

    return (
        <div className="space-y-3">
            {items.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-turquoise-500">
                    No items yet. Add the first one below.
                </p>
            )}

            {items.map((item, index) => (
                <div key={item.id ?? `new-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-turquoise-500">Item {index + 1}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onMove(index, -1)}
                                disabled={index === 0}
                                className="rounded-lg border border-white/10 p-1.5 text-turquoise-400 hover:bg-white/10 disabled:opacity-30"
                                title="Move up"
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button
                                onClick={() => onMove(index, 1)}
                                disabled={index === items.length - 1}
                                className="rounded-lg border border-white/10 p-1.5 text-turquoise-400 hover:bg-white/10 disabled:opacity-30"
                                title="Move down"
                            >
                                <ArrowDown size={14} />
                            </button>
                            <button
                                onClick={() => onRemove(index)}
                                className="rounded-lg border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10"
                                title="Remove item"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {fields.map((field) => (
                            <Field
                                key={field.key}
                                field={field}
                                value={item[field.key]}
                                onChange={(value) => onChange(index, field.key, value)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={onAdd}
                className="flex items-center gap-2 rounded-xl border border-gold-500/30 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
            >
                <Plus size={14} /> Add item
            </button>
        </div>
    );
}

function Field({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (value: unknown) => void }) {
    return (
        <div className={field.wide ? 'sm:col-span-2' : ''}>
            <label className="admin-label">{field.label}</label>
            {field.type === 'textarea' ? (
                <textarea
                    value={String(value ?? '')}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    className="admin-input min-h-[90px]"
                />
            ) : field.type === 'select' ? (
                <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="admin-input">
                    {field.options?.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : field.type === 'checkbox' ? (
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => onChange(event.target.checked)}
                    className="h-4 w-4 accent-amber-500"
                />
            ) : (
                <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={value === null || value === undefined ? '' : String(value)}
                    onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
                    placeholder={field.placeholder}
                    className="admin-input"
                />
            )}
        </div>
    );
}
