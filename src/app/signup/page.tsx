'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, Loader2, LockKeyhole, Mail, MapPin, Phone, UserRound } from 'lucide-react';

export default function OrganizationSignupPage() {
    const [form, setForm] = useState({
        organizationName: '',
        organizationEmail: '',
        organizationPhone: '',
        country: '',
        city: '',
        address: '',
        displayName: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{ email: string; sent: boolean; verificationUrl?: string } | null>(null);

    const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to create the organization');
            setSuccess({
                email: form.organizationEmail,
                sent: Boolean(data.verificationSent),
                verificationUrl: data.verificationUrl,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create the organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 py-12">
            <div className="w-full max-w-3xl">
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
                    <img
                        src="/icons/openMusabaqa-logo.svg"
                        alt="OpenMusabaqa logo"
                        className="w-12 h-12 rounded-2xl shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <div>
                        <p className="gold-text text-2xl font-black">OpenMusabaqa</p>
                        <p className="text-turquoise-500 text-[10px] uppercase tracking-[0.25em]">Organization onboarding</p>
                    </div>
                </Link>

                <div className="glass-card p-8 md:p-10">
                    {success ? (
                        <div className="text-center">
                            <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
                            <h1 className="mt-5 text-3xl font-black text-white">Organization created</h1>
                            <p className="mx-auto mt-3 max-w-lg text-sm text-turquoise-400">
                                We sent a verification link to <strong className="text-white">{success.email}</strong>. Confirm it to
                                activate your workspace, then sign in with your admin username.
                            </p>
                            {!success.sent && (
                                <p className="mx-auto mt-4 max-w-lg rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-xs text-gold-200">
                                    No email provider is configured, so the message was logged on the server. Use the development link
                                    below or configure RESEND_API_KEY / SMTP.
                                </p>
                            )}
                            {success.verificationUrl && (
                                <Link href={success.verificationUrl} className="mt-4 block break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-turquoise-300 hover:text-gold-300">
                                    {success.verificationUrl}
                                </Link>
                            )}
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Link href="/verify-email" className="btn-gold px-5 py-2.5 text-sm">
                                    Verification help
                                </Link>
                                <Link href="/login" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-turquoise-300 hover:text-white">
                                    Go to sign in
                                </Link>
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Create your organization</h1>
                        <p className="text-turquoise-400 text-sm mt-2">
                            You will become the administrator of this workspace. Judges and competitions are managed from your dashboard.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gold-400">Organization</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Organization name *</label>
                                    <div className="relative">
                                        <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input required value={form.organizationName} onChange={update('organizationName')} className="admin-input pl-11" placeholder="Al-Noor Quran Institute" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Organization email *</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input required type="email" value={form.organizationEmail} onChange={update('organizationEmail')} className="admin-input pl-11" placeholder="contact@example.org" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Phone</label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input value={form.organizationPhone} onChange={update('organizationPhone')} className="admin-input pl-11" placeholder="+253 ..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Address</label>
                                    <input value={form.address} onChange={update('address')} className="admin-input" placeholder="Street / district" />
                                </div>
                                <div>
                                    <label className="admin-label">Country</label>
                                    <div className="relative">
                                        <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input value={form.country} onChange={update('country')} className="admin-input pl-11" placeholder="Djibouti" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">City</label>
                                    <input value={form.city} onChange={update('city')} className="admin-input" placeholder="Djibouti City" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gold-400">Administrator account</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="admin-label">Display name</label>
                                    <div className="relative">
                                        <UserRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input value={form.displayName} onChange={update('displayName')} className="admin-input pl-11" placeholder="Your name" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Username (optional — auto-generated)</label>
                                    <input value={form.username} onChange={update('username')} className="admin-input" placeholder="admin.org" />
                                </div>
                                <div>
                                    <label className="admin-label">Password *</label>
                                    <div className="relative">
                                        <LockKeyhole size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input required type="password" value={form.password} onChange={update('password')} className="admin-input pl-11" placeholder="At least 8 characters with a number" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Confirm password *</label>
                                    <input required type="password" value={form.confirmPassword} onChange={update('confirmPassword')} className="admin-input" placeholder="Repeat password" />
                                </div>
                            </div>
                        </section>

                        {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

                        <button type="submit" disabled={loading} className="btn-gold w-full py-3 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create organization'}
                        </button>
                    </form>

                    <p className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-turquoise-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-gold-400 hover:text-gold-300 font-semibold">Sign in</Link>
                    </p>
                    </>
                    )}
                </div>
            </div>
        </main>
    );
}
