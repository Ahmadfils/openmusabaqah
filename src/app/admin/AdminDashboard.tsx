'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BarChart3,
    BookOpen,
    ChevronDown,
    Copy,
    ExternalLink,
    Layers,
    Loader2,
    LogOut,
    Plus,
    Settings,
    Trophy,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { errorMessage, post } from '@/lib/client-api';
import SettingsTab from './tabs/SettingsTab';
import GroupsTab from './tabs/GroupsTab';
import QuestionsTab from './tabs/QuestionsTab';
import ParticipantsTab from './tabs/ParticipantsTab';
import JudgesTab from './tabs/JudgesTab';
import LiveTab from './tabs/LiveTab';

type Tab = 'setup' | 'groups' | 'questions' | 'participants' | 'judges' | 'live';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'setup', label: 'Setup', icon: <Settings size={15} /> },
    { key: 'groups', label: 'Groups', icon: <Layers size={15} /> },
    { key: 'questions', label: 'Questions', icon: <BookOpen size={15} /> },
    { key: 'participants', label: 'Participants', icon: <Users size={15} /> },
    { key: 'judges', label: 'Judges', icon: <UserCog size={15} /> },
    { key: 'live', label: 'Live stage', icon: <BarChart3 size={15} /> },
];

export default function AdminDashboard({
    user,
}: {
    user: { username: string; displayName: string | null };
}) {
    const router = useRouter();
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [detail, setDetail] = useState<any>(null);
    const [tab, setTab] = useState<Tab>('setup');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '' });
    const [copied, setCopied] = useState('');

    const loadCompetitions = useCallback(async (selectId?: string) => {
        const data = await fetch('/api/admin/competitions', { credentials: 'same-origin' }).then(async (res) => {
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to load competitions');
            return payload as any[];
        });
        setCompetitions(data);
        const nextId = selectId || (data.some((competition) => competition.id === selectedId) ? selectedId : data[0]?.id || '');
        setSelectedId(nextId);
        return { data, nextId };
    }, [selectedId]);

    const loadDetail = useCallback(async (competitionId: string) => {
        if (!competitionId) {
            setDetail(null);
            return;
        }
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/competitions/${competitionId}`, { credentials: 'same-origin' });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to load competition');
            setDetail(payload);
            setError('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { nextId } = await loadCompetitions();
                if (nextId) await loadDetail(nextId);
            } catch (err) {
                setError(errorMessage(err));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedId) loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const refreshDetail = useCallback(async () => {
        if (selectedId) await loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const createCompetition = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!createForm.name.trim()) return;
        setCreating(true);
        setError('');
        try {
            const created = await post('/api/admin/competitions', createForm);
            setCreateForm({ name: '', slug: '', description: '' });
            setShowCreate(false);
            await loadCompetitions(created.id);
            setSelectedId(created.id);
            setTab('setup');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setCreating(false);
        }
    };

    const logout = async () => {
        await post('/api/auth/logout', {});
        router.replace('/login');
        router.refresh();
    };

    const copy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(value);
            setTimeout(() => setCopied(''), 1800);
        } catch {
            setError('Could not copy to clipboard');
        }
    };

    const copyLink = (path: string) => {
        const url = `${window.location.origin}${path}`;
        copy(url);
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-gold-500" size={40} />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="glass-card px-5 py-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 gold-text font-black text-lg">
                            <BookOpen size={20} /> OpenMusabaqah
                        </Link>
                        <span className="hidden md:block h-6 w-px bg-white/10" />
                        <div>
                            <p className="text-white font-bold leading-tight">{user.displayName || user.username}</p>
                            <p className="text-turquoise-500 text-[10px] uppercase tracking-[0.2em]">Organization administrator</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {detail && (
                            <>
                                <button
                                    onClick={() => copyLink(`/register/${detail.slug}`)}
                                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-turquoise-300 hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                    <Copy size={12} /> Registration
                                </button>
                                <button
                                    onClick={() => copyLink(`/leaderboard/${detail.slug}`)}
                                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-turquoise-300 hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                    <Trophy size={12} /> Leaderboard
                                </button>
                                <Link
                                    href={`/live/${detail.slug}`}
                                    target="_blank"
                                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-turquoise-300 hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                    <ExternalLink size={12} /> Stage
                                </Link>
                            </>
                        )}
                        <button
                            onClick={logout}
                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                        >
                            <LogOut size={12} /> Sign out
                        </button>
                    </div>
                </header>

                {copied && (
                    <div className="mb-4 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                        Link copied to clipboard.
                    </div>
                )}
                {error && (
                    <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <span>{error}</span>
                        <button onClick={() => setError('')}><X size={16} /></button>
                    </div>
                )}

                <div className="glass-card p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-[10px] text-turquoise-500 font-bold uppercase tracking-widest">Competition</span>
                        <div className="relative flex-1 max-w-xl">
                            <select
                                value={selectedId}
                                onChange={(event) => setSelectedId(event.target.value)}
                                className="admin-input w-full"
                            >
                                {competitions.length === 0 && <option value="">No competitions yet</option>}
                                {competitions.map((competition) => (
                                    <option key={competition.id} value={competition.id}>
                                        {competition.name} ({competition.status})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gold-500" />
                        </div>
                    </div>
                    <button onClick={() => setShowCreate((value) => !value)} className="btn-gold py-2 px-4 text-sm flex items-center gap-2 justify-center">
                        <Plus size={16} /> New competition
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={createCompetition} className="glass-card p-6 mb-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Create competition</h2>
                            <button type="button" onClick={() => setShowCreate(false)} className="text-turquoise-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="admin-label">Name *</label>
                                <input required value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} className="admin-input" placeholder="Ramadan Musabaqah 1447" />
                            </div>
                            <div>
                                <label className="admin-label">Public slug (optional)</label>
                                <input value={createForm.slug} onChange={(event) => setCreateForm({ ...createForm, slug: event.target.value })} className="admin-input" placeholder="ramadan-1447" />
                            </div>
                            <div>
                                <label className="admin-label">Description</label>
                                <input value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} className="admin-input" placeholder="Short summary" />
                            </div>
                        </div>
                        <button type="submit" disabled={creating} className="btn-gold mt-5 px-5 py-2.5 text-sm flex items-center gap-2">
                            {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Create competition
                        </button>
                    </form>
                )}

                {competitions.length === 0 && !showCreate && (
                    <div className="glass-card p-16 text-center text-turquoise-500 border-dashed border-2 border-turquoise-500/20">
                        <Trophy size={64} className="mx-auto mb-6 text-turquoise-800" />
                        <h2 className="text-2xl font-black text-white mb-2">Create your first competition</h2>
                        <p className="text-sm max-w-md mx-auto">Set up groups, questions, judges, and public registration from one workspace.</p>
                        <button onClick={() => setShowCreate(true)} className="btn-gold mt-6 px-5 py-2.5 text-sm inline-flex items-center gap-2"><Plus size={16} /> New competition</button>
                    </div>
                )}

                {detailLoading && !detail && (
                    <div className="glass-card p-16 flex justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>
                )}

                {detail && (
                    <>
                        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {tabs.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setTab(item.key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                                        tab === item.key
                                            ? 'bg-gold-500 text-turquoise-950 shadow-lg shadow-gold-500/20'
                                            : 'glass-card text-turquoise-300 hover:text-white'
                                    }`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </nav>

                        {tab === 'setup' && <SettingsTab competition={detail} onSaved={refreshDetail} />}
                        {tab === 'groups' && <GroupsTab competition={detail} onChanged={refreshDetail} />}
                        {tab === 'questions' && <QuestionsTab competition={detail} />}
                        {tab === 'participants' && <ParticipantsTab competition={detail} onChanged={refreshDetail} />}
                        {tab === 'judges' && <JudgesTab competition={detail} onChanged={refreshDetail} />}
                        {tab === 'live' && <LiveTab competition={detail} />}
                    </>
                )}
            </div>
        </main>
    );
}
