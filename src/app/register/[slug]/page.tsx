'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Copy, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const [competition, setCompetition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [form, setForm] = useState({
        name: '',
        age: '',
        country: '',
        city: '',
        phone: '',
        desiredGroupIds: [] as string[],
    });

    useEffect(() => {
        fetch(`/api/public/competitions/${slug}`, { credentials: 'same-origin' })
            .then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Competition not found');
                return payload;
            })
            .then(setCompetition)
            .catch((err) => setError(err instanceof Error ? err.message : 'Competition not found'))
            .finally(() => setLoading(false));
    }, [slug]);

    const toggleGroup = (groupId: string) => {
        setForm((prev) => ({
            ...prev,
            desiredGroupIds: prev.desiredGroupIds.includes(groupId)
                ? prev.desiredGroupIds.filter((id) => id !== groupId)
                : [...prev.desiredGroupIds, groupId],
        }));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        if (form.desiredGroupIds.length === 0) {
            setError('Choose at least one desired group.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/public/competitions/${slug}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: form.name,
                    age: form.age ? Number(form.age) : undefined,
                    country: form.country,
                    city: form.city,
                    phone: form.phone || undefined,
                    desiredGroupIds: form.desiredGroupIds,
                }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Unable to register');
            setResult(payload);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to register');
        } finally {
            setSubmitting(false);
        }
    };

    const copyCode = async () => {
        if (!result?.participant?.registrationCode) return;
        await navigator.clipboard.writeText(result.participant.registrationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const open = competition?.publicRegistration && competition?.registrationOpen && competition?.status !== 'COMPLETED';

    return (
        <main className="min-h-screen p-6 md:p-10">
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/results" className="inline-flex items-center gap-2 text-sm text-turquoise-400 hover:text-gold-300">
                    <ArrowLeft size={16} /> All competitions
                </Link>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : !competition ? (
                    <div className="glass-card p-10 text-center text-red-300">{error || 'Competition not found'}</div>
                ) : result ? (
                    <div className="glass-card p-10 text-center">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
                        <h1 className="mt-4 text-3xl font-black text-white">Registration received</h1>
                        <p className="mt-2 text-sm text-turquoise-400">
                            {result.participant.name}, your request for <span className="text-gold-300">{result.competition.name}</span> is pending
                            approval by the organizer.
                        </p>
                        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">Your reference code</p>
                            <p className="mt-2 font-mono text-3xl font-black tracking-widest text-white">
                                {result.participant.registrationCode}
                            </p>
                            <button
                                onClick={copyCode}
                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gold-500/30 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
                            >
                                <Copy size={13} /> {copied ? 'Copied' : 'Copy code'}
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-turquoise-500">Keep this code. The organizer will use it to confirm your participation.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            <Link href={`/leaderboard/${slug}`} className="btn-gold px-5 py-2 text-sm">
                                View leaderboard
                            </Link>
                            <Link
                                href={`/live/${slug}`}
                                className="rounded-xl border border-turquoise-500/30 px-5 py-2 text-sm font-semibold text-turquoise-300 hover:bg-turquoise-500/10"
                            >
                                Live stage
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise-500">
                                {competition.organization?.name}
                            </p>
                            <h1 className="mt-1 text-4xl font-black text-white">Register</h1>
                            <p className="mt-2 text-lg text-gold-300">{competition.name}</p>
                            {competition.description && <p className="mt-2 text-sm text-turquoise-400">{competition.description}</p>}
                        </div>

                        {!open ? (
                            <div className="glass-card p-10 text-center">
                                <UserPlus size={36} className="mx-auto text-turquoise-700" />
                                <p className="mt-4 font-semibold text-white">Registration is closed</p>
                                <p className="mt-2 text-sm text-turquoise-500">
                                    Public registration is not currently available for this competition.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="glass-card space-y-5 p-8">
                                <div>
                                    <label className="admin-label">Full name</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                                        className="admin-input w-full"
                                        placeholder="Participant name"
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="admin-label">Age</label>
                                        <input
                                            required
                                            type="number"
                                            min={3}
                                            max={120}
                                            value={form.age}
                                            onChange={(event) => setForm({ ...form, age: event.target.value })}
                                            className="admin-input w-full"
                                            placeholder="Age"
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">Phone (optional)</label>
                                        <input
                                            value={form.phone}
                                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                            className="admin-input w-full"
                                            placeholder="+000 000 000"
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">Country</label>
                                        <input
                                            required
                                            value={form.country}
                                            onChange={(event) => setForm({ ...form, country: event.target.value })}
                                            className="admin-input w-full"
                                            placeholder="Country"
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">City</label>
                                        <input
                                            required
                                            value={form.city}
                                            onChange={(event) => setForm({ ...form, city: event.target.value })}
                                            className="admin-input w-full"
                                            placeholder="City"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="admin-label">Desired groups</label>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {competition.groups?.length === 0 && (
                                            <p className="text-sm text-turquoise-500">No groups are configured yet.</p>
                                        )}
                                        {competition.groups?.map((group: any) => (
                                            <label
                                                key={group.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                                                    form.desiredGroupIds.includes(group.id)
                                                        ? 'border-gold-500/50 bg-gold-500/10 text-white'
                                                        : 'border-white/10 bg-white/5 text-turquoise-300 hover:bg-white/10'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.desiredGroupIds.includes(group.id)}
                                                    onChange={() => toggleGroup(group.id)}
                                                    className="mt-0.5 h-4 w-4 accent-amber-500"
                                                />
                                                <span>
                                                    <span className="block font-semibold">{group.name}</span>
                                                    {group.description && <span className="block text-xs text-turquoise-500">{group.description}</span>}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

                                <button type="submit" disabled={submitting || competition.groups?.length === 0} className="btn-gold flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                    Submit registration
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
