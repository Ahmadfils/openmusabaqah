'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Loader2, LogOut, Plus, Power, ShieldCheck, X } from 'lucide-react';
import { errorMessage, post, put } from '@/lib/client-api';

const emptyForm = {
    organizationName: '',
    organizationEmail: '',
    organizationPhone: '',
    country: '',
    city: '',
    address: '',
    displayName: '',
    username: '',
    password: '',
};

export default function SuperAdminConsole({ user }: { user: { username: string; displayName: string | null } }) {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const load = useCallback(async () => {
        try {
            const data = await fetch('/api/superadmin/organizations', { credentials: 'same-origin' }).then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload.error || 'Unable to load organizations');
                return payload as any[];
            });
            setOrganizations(data);
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

    const createOrganization = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy('create');
        setError('');
        setNotice('');
        try {
            const result = await post('/api/superadmin/organizations', {
                organizationName: form.organizationName,
                organizationEmail: form.organizationEmail,
                organizationPhone: form.organizationPhone || undefined,
                country: form.country || undefined,
                city: form.city || undefined,
                address: form.address || undefined,
                displayName: form.displayName,
                username: form.username || undefined,
                password: form.password,
            });
            setNotice(`Organization "${result.organization.name}" created. Admin username: ${result.admin.username}`);
            setForm(emptyForm);
            setShowCreate(false);
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const toggleOrganization = async (organization: any) => {
        const next = !organization.isActive;
        if (!next && !window.confirm(`Disable ${organization.name}? All of its users will be signed out.`)) return;
        setBusy(`toggle-${organization.id}`);
        setError('');
        try {
            await put(`/api/superadmin/organizations/${organization.id}`, { isActive: next });
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        router.push('/login');
        router.refresh();
    };

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <header className="glass-card flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-500">
                            <ShieldCheck size={14} /> Superadmin
                        </p>
                        <h1 className="mt-1 text-2xl font-black text-white">Organizations</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-bold text-white">{user.displayName || user.username}</p>
                            <p className="text-[10px] uppercase tracking-widest text-turquoise-500">Platform owner</p>
                        </div>
                        <Link href="/" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-turquoise-400 hover:bg-white/10">
                            Home
                        </Link>
                        <button onClick={logout} className="rounded-lg border border-white/10 p-2 text-turquoise-400 hover:bg-white/10 hover:text-white" title="Sign out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
                {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}

                <div className="flex items-center justify-between">
                    <p className="text-sm text-turquoise-400">
                        {organizations.length} organization{organizations.length === 1 ? '' : 's'} on the platform
                    </p>
                    <button
                        onClick={() => setShowCreate((value) => !value)}
                        className="flex items-center gap-2 rounded-xl border border-gold-500/30 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10"
                    >
                        {showCreate ? <X size={14} /> : <Plus size={14} />} {showCreate ? 'Cancel' : 'New organization'}
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={createOrganization} className="glass-card grid gap-4 p-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <h2 className="font-bold text-white">Organization & first admin</h2>
                            <p className="text-xs text-turquoise-500">The admin account manages competitions, judges, and participants.</p>
                        </div>
                        {[
                            ['organizationName', 'Organization name', true],
                            ['organizationEmail', 'Organization email', true],
                            ['organizationPhone', 'Phone (optional)', false],
                            ['country', 'Country', false],
                            ['city', 'City', false],
                            ['address', 'Address (optional)', false],
                            ['displayName', 'Admin display name', true],
                            ['username', 'Admin username (optional)', false],
                            ['password', 'Admin password', true],
                        ].map(([field, label, required]) => (
                            <div key={field as string}>
                                <label className="admin-label">{label as string}</label>
                                <input
                                    required={required as boolean}
                                    type={field === 'password' ? 'password' : 'text'}
                                    value={(form as any)[field as string]}
                                    onChange={(event) => setForm({ ...form, [field as string]: event.target.value })}
                                    className="admin-input w-full"
                                    placeholder={field === 'password' ? 'Minimum 8 characters' : (label as string)}
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <button type="submit" disabled={busy !== ''} className="btn-gold flex items-center justify-center gap-2 px-5 py-2 text-sm disabled:opacity-50">
                                {busy === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />} Create organization
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="glass-card p-10 text-center text-sm text-turquoise-500">No organizations yet.</div>
                ) : (
                    <div className="space-y-3">
                        {organizations.map((organization) => (
                            <div key={organization.id} className="glass-card flex flex-wrap items-start justify-between gap-4 p-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-white">{organization.name}</h2>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                organization.isActive
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                                            }`}
                                        >
                                            {organization.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-turquoise-400">
                                        {organization.email}
                                        {organization.city || organization.country
                                            ? ` · ${[organization.city, organization.country].filter(Boolean).join(', ')}`
                                            : ''}
                                    </p>
                                    <p className="mt-1 text-xs text-turquoise-500">
                                        {organization._count?.competitions ?? 0} competitions · {organization._count?.users ?? 0} users
                                    </p>
                                    <p className="mt-2 text-[11px] text-turquoise-500">
                                        Admins:{' '}
                                        {organization.users?.length
                                            ? organization.users.map((admin: any) => `${admin.displayName || admin.username} (${admin.username})`).join(', ')
                                            : '—'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleOrganization(organization)}
                                    disabled={busy !== ''}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                        organization.isActive
                                            ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
                                            : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                                    }`}
                                >
                                    {busy === `toggle-${organization.id}` ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                                    {organization.isActive ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
