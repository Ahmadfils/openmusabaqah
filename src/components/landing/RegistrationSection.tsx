'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import SectionHeading from './SectionHeading';

const emptyForm = {
    organizationName: '',
    organizationEmail: '',
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
};

export default function RegistrationSection() {
    const [form, setForm] = useState(emptyForm);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState<{ email: string; sent: boolean; verificationUrl?: string } | null>(null);

    const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        if (form.password !== form.confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }
        setStatus('loading');
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
            setStatus('success');
            setForm(emptyForm);
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to create the organization');
        }
    };

    return (
        <section id="register" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                <div>
                    <SectionHeading
                        eyebrow="Registration"
                        title="Bring your competition to OpenMusabaqa"
                        description="Create an organization workspace in minutes. Your admin account controls competitions, judges, participants and visibility."
                    />
                    <ol className="mt-8 space-y-4">
                        {[
                            ['Register the organization', 'Tell us about your institution and choose an admin username.'],
                            ['Verify the contact email', 'A secure link activates the workspace; links expire after 24 hours.'],
                            ['Set up and invite judges', 'Admins create judges, assign competitions and publish public portals.'],
                        ].map(([title, text], index) => (
                            <li key={title} className="flex gap-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10 font-mono text-xs font-bold text-gold-300">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-white">{title}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-turquoise-400">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-8 rounded-2xl border border-turquoise-500/20 bg-turquoise-500/5 p-4 text-xs text-turquoise-300">
                        <span className="flex items-center gap-2 font-semibold text-turquoise-200">
                            <ShieldCheck size={14} /> Privacy by default
                        </span>
                        <p className="mt-1.5 leading-relaxed">
                            New organizations stay hidden from public listings until the contact email is verified. Only organization admins
                            can switch a competition between public and private.
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 md:p-8">
                    {success ? (
                        <div className="py-6 text-center">
                            <CheckCircle2 className="mx-auto text-emerald-400" size={44} />
                            <h3 className="mt-4 text-2xl font-black text-white">Check your inbox</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-turquoise-400">
                                We sent a verification link to <strong className="text-white">{success.email}</strong>. Confirm it, then sign in
                                with your admin username.
                            </p>
                            {!success.sent && (
                                <p className="mx-auto mt-4 max-w-md rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-xs text-gold-200">
                                    Email delivery is not configured on this deployment. The message was logged on the server.
                                </p>
                            )}
                            {success.verificationUrl && (
                                <Link href={success.verificationUrl} className="mt-4 block break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-turquoise-300 hover:text-gold-300">
                                    {success.verificationUrl}
                                </Link>
                            )}
                            <Link href="/login" className="btn-gold mt-6 inline-flex px-5 py-2.5 text-sm">Go to sign in</Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
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
                                    <label className="admin-label">Country</label>
                                    <input value={form.country} onChange={update('country')} className="admin-input" placeholder="Djibouti" />
                                </div>
                                <div>
                                    <label className="admin-label">Admin display name</label>
                                    <div className="relative">
                                        <UserRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-500" />
                                        <input value={form.displayName} onChange={update('displayName')} className="admin-input pl-11" placeholder="Your name" />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Admin username</label>
                                    <input value={form.username} onChange={update('username')} className="admin-input" placeholder="Auto-generated if empty" />
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

                            {status === 'error' && message && (
                                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">{message}</p>
                            )}

                            <button type="submit" disabled={status === 'loading'} className="btn-gold flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60">
                                {status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : 'Create organization'}
                            </button>
                            <p className="text-center text-[11px] text-turquoise-500">
                                Already registered? <Link href="/login" className="text-gold-400 hover:text-gold-300">Sign in</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
