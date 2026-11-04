'use client';

import { useEffect, useState } from 'react';
import { Copy, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { errorMessage, put } from '@/lib/client-api';

type Criterion = { key: string; label: string; max: number; weight: number };

export default function SettingsTab({
    competition,
    onSaved,
}: {
    competition: any;
    onSaved: () => Promise<void> | void;
}) {
    const [form, setForm] = useState({
        name: competition.name,
        slug: competition.slug,
        description: competition.description || '',
        status: competition.status,
        leaderboardVisibility: competition.leaderboardVisibility,
        publicRegistration: competition.publicRegistration,
        registrationOpen: competition.registrationOpen,
        pointsMode: competition.pointsMode,
        themeColor: competition.themeColor || '#14b8a6',
        logoUrl: competition.logoUrl || '',
        scoringCriteria: (competition.scoringCriteria || []) as Criterion[],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState('');

    useEffect(() => {
        setForm({
            name: competition.name,
            slug: competition.slug,
            description: competition.description || '',
            status: competition.status,
            leaderboardVisibility: competition.leaderboardVisibility,
            publicRegistration: competition.publicRegistration,
            registrationOpen: competition.registrationOpen,
            pointsMode: competition.pointsMode,
            themeColor: competition.themeColor || '#14b8a6',
            logoUrl: competition.logoUrl || '',
            scoringCriteria: (competition.scoringCriteria || []) as Criterion[],
        });
    }, [competition]);

    const updateCriterion = (index: number, patch: Partial<Criterion>) => {
        setForm((prev) => ({
            ...prev,
            scoringCriteria: prev.scoringCriteria.map((criterion, i) => (i === index ? { ...criterion, ...patch } : criterion)),
        }));
    };

    const addCriterion = () => {
        setForm((prev) => ({
            ...prev,
            scoringCriteria: [
                ...prev.scoringCriteria,
                { key: `criterion_${prev.scoringCriteria.length + 1}`, label: 'New criterion', max: 20, weight: 20 },
            ],
        }));
    };

    const removeCriterion = (index: number) => {
        setForm((prev) => ({
            ...prev,
            scoringCriteria: prev.scoringCriteria.filter((_, i) => i !== index),
        }));
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await put(`/api/admin/competitions/${competition.id}`, form);
            setMessage('Settings saved');
            await onSaved();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const copyLink = async (path: string) => {
        const url = `${window.location.origin}${path}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(url);
            setTimeout(() => setCopied(''), 1800);
        } catch {
            setError('Could not copy to clipboard');
        }
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={save} className="glass-card p-6 md:p-8 space-y-8">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Competition setup</h2>
                    <p className="text-turquoise-500 text-sm mt-1">Identity, visibility and scoring rules.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                        <label className="admin-label">Name</label>
                        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" required />
                    </div>
                    <div>
                        <label className="admin-label">Public slug</label>
                        <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Status</label>
                        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="admin-input">
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="admin-label">Description</label>
                        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="admin-input" />
                    </div>
                    <div>
                        <label className="admin-label">Leaderboard visibility</label>
                        <select value={form.leaderboardVisibility} onChange={(event) => setForm({ ...form, leaderboardVisibility: event.target.value })} className="admin-input">
                            <option value="PUBLIC">Public — names and points</option>
                            <option value="HIDDEN_POINTS">Public — hide points</option>
                            <option value="PRIVATE">Private — staff only</option>
                        </select>
                    </div>
                    <div>
                        <label className="admin-label">Points mode</label>
                        <select value={form.pointsMode} onChange={(event) => setForm({ ...form, pointsMode: event.target.value })} className="admin-input">
                            <option value="FIXED">Fixed points</option>
                            <option value="PERCENT">Percent / weighted</option>
                        </select>
                    </div>
                    <div>
                        <label className="admin-label">Theme color</label>
                        <input value={form.themeColor} onChange={(event) => setForm({ ...form, themeColor: event.target.value })} className="admin-input" placeholder="#14b8a6" />
                    </div>
                    <div className="flex flex-col gap-3 justify-end">
                        <label className="flex items-center gap-3 text-sm text-white">
                            <input type="checkbox" checked={form.publicRegistration} onChange={(event) => setForm({ ...form, publicRegistration: event.target.checked })} className="accent-gold-500 w-4 h-4" />
                            Enable public registration form
                        </label>
                        <label className="flex items-center gap-3 text-sm text-white">
                            <input type="checkbox" checked={form.registrationOpen} onChange={(event) => setForm({ ...form, registrationOpen: event.target.checked })} className="accent-gold-500 w-4 h-4" />
                            Registration currently open
                        </label>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Scoring criteria & ponderation</h3>
                            <p className="text-turquoise-500 text-xs mt-1">
                                {form.pointsMode === 'PERCENT'
                                    ? 'Judges score each criterion out of 100; weights are normalised to produce a total out of 100.'
                                    : 'Judges enter achieved points for each criterion; the total is the sum of fixed caps.'}
                            </p>
                        </div>
                        <button type="button" onClick={addCriterion} className="btn-turquoise py-2 px-3 text-xs flex items-center gap-1.5">
                            <Plus size={14} /> Add criterion
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.scoringCriteria.map((criterion, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="md:col-span-3">
                                    <label className="admin-label">Label</label>
                                    <input value={criterion.label} onChange={(event) => updateCriterion(index, { label: event.target.value })} className="admin-input py-2" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="admin-label">Key</label>
                                    <input value={criterion.key} onChange={(event) => updateCriterion(index, { key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className="admin-input py-2 font-mono text-xs" />
                                </div>
                                {form.pointsMode === 'FIXED' ? (
                                    <div className="md:col-span-3">
                                        <label className="admin-label">Max points</label>
                                        <input type="number" min={1} step="0.5" value={criterion.max} onChange={(event) => updateCriterion(index, { max: Number(event.target.value) })} className="admin-input py-2" />
                                    </div>
                                ) : (
                                    <div className="md:col-span-3">
                                        <label className="admin-label">Weight %</label>
                                        <input type="number" min={0} step="0.5" value={criterion.weight} onChange={(event) => updateCriterion(index, { weight: Number(event.target.value) })} className="admin-input py-2" />
                                    </div>
                                )}
                                <div className="md:col-span-3 flex justify-end">
                                    <button type="button" onClick={() => removeCriterion(index)} className="text-red-400/70 hover:text-red-300 p-2" disabled={form.scoringCriteria.length <= 1}>
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
                {message && <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{message}</p>}

                <button type="submit" disabled={saving} className="btn-gold px-6 py-3 text-sm flex items-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save settings
                </button>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="glass-card p-5">
                    <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-3">Public registration</p>
                    <p className="text-xs text-turquoise-300 break-all">/register/{competition.slug}</p>
                    <button onClick={() => copyLink(`/register/${competition.slug}`)} className="mt-3 text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1.5"><Copy size={13} /> Copy link</button>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-3">Live leaderboard</p>
                    <p className="text-xs text-turquoise-300 break-all">/leaderboard/{competition.slug}</p>
                    <button onClick={() => copyLink(`/leaderboard/${competition.slug}`)} className="mt-3 text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1.5"><Copy size={13} /> Copy link</button>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest mb-3">Participant stage</p>
                    <p className="text-xs text-turquoise-300 break-all">/live/{competition.slug}</p>
                    <button onClick={() => copyLink(`/live/${competition.slug}`)} className="mt-3 text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1.5"><Copy size={13} /> Copy link</button>
                </div>
            </div>

            {copied && <p className="text-xs text-emerald-300">Copied: {copied}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    ['Groups', competition.groups?.length ?? 0],
                    ['Participants', competition._count?.participants ?? 0],
                    ['Judges assigned', competition.judgeAssignments?.filter((assignment: any) => assignment.isActive).length ?? 0],
                    ['Active judge slots', competition.activeJudgeCount ?? 0],
                ].map(([label, value]) => (
                    <div key={String(label)} className="glass-card p-4 text-center">
                        <p className="text-2xl font-black text-gold-400">{value}</p>
                        <p className="text-[10px] text-turquoise-500 uppercase tracking-widest">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
