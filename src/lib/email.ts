import 'server-only';

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { appUrl } from '@/lib/app-url';
import { isBrevoConfigured, sendBrevoTransactional } from '@/lib/brevo';

export { appUrl };

type Provider = 'resend' | 'brevo' | 'smtp' | 'console';

export type EmailResult = {
    ok: boolean;
    provider: string;
    skipped: boolean;
    detail?: string;
};

type MailInput = {
    to: string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    kind?: 'TRANSACTIONAL' | 'BULK';
    createdById?: string;
};

const from = process.env.EMAIL_FROM || 'OpenMusabaqa <no-reply@openmusabaqa.org>';
const resendKey = process.env.RESEND_API_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const configuredProvider = (process.env.EMAIL_PROVIDER || '').toLowerCase() as Provider | '';

function transactionalProvider(): Provider {
    if (configuredProvider === 'resend' && resendKey) return 'resend';
    if (configuredProvider === 'brevo' && isBrevoConfigured()) return 'brevo';
    if (configuredProvider === 'smtp' && smtpHost) return 'smtp';
    if (configuredProvider === 'console') return 'console';
    if (resendKey) return 'resend';
    if (smtpHost) return 'smtp';
    if (isBrevoConfigured()) return 'brevo';
    return 'console';
}

export function verificationUrl(token: string): string {
    return `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

// Verification links are echoed back to the browser only when no real mailer is
// configured (local development) so the flow remains testable.
export function shouldExposeDevLinks(): boolean {
    return transactionalProvider() === 'console' && process.env.NODE_ENV !== 'production';
}

export function emailShell(title: string, body: string): string {
    return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#042f2e;font-family:Outfit,Arial,sans-serif;color:#e2e8f0;padding:32px 16px">
    <table role="presentation" style="max-width:560px;margin:0 auto;width:100%;border-collapse:collapse;background:#053b38;border:1px solid #115e59;border-radius:16px;overflow:hidden">
      <tr><td style="padding:24px 28px;border-bottom:1px solid #115e59">
        <p style="margin:0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#fbbf24">OpenMusabaqa</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff">${title}</h1>
      </td></tr>
      <tr><td style="padding:28px;font-size:15px;line-height:1.65;color:#cbd5e1">${body}</td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #115e59;font-size:12px;color:#5eead4">
        OpenMusabaqa · Quran competition platform
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(input: {
    to: string;
    organizationName: string;
    token: string;
    createdById?: string;
}): Promise<EmailResult> {
    const link = verificationUrl(input.token);
    const html = emailShell(
        'Verify your organization',
        `<p>Assalamu alaikum,</p>
         <p>Confirm the contact email for <strong style="color:#ffffff">${escapeHtml(input.organizationName)}</strong> to activate your OpenMusabaqa workspace.</p>
         <p style="margin:24px 0">
           <a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#f59e0b;color:#111827;font-weight:700;text-decoration:none">Verify email</a>
         </p>
         <p style="font-size:13px;color:#94a3b8">This link expires in 24 hours. If you did not request this account, you can ignore this message.</p>
         <p style="font-size:12px;color:#64748b;word-break:break-all">${link}</p>`,
    );
    return sendMail({
        to: [input.to],
        subject: 'Verify your OpenMusabaqa organization',
        html,
        text: `Verify your organization: ${link}`,
        createdById: input.createdById,
    });
}

export async function sendJudgeInviteEmail(input: {
    to: string;
    judgeName: string;
    username: string;
    password: string;
    organizationName: string;
    competitionName?: string;
    createdById?: string;
}): Promise<EmailResult> {
    const html = emailShell(
        'Your judge account is ready',
        `<p>Assalamu alaikum ${escapeHtml(input.judgeName)},</p>
         <p><strong style="color:#ffffff">${escapeHtml(input.organizationName)}</strong> created a judge account for you on OpenMusabaqa${
             input.competitionName ? ` for <strong style="color:#ffffff">${escapeHtml(input.competitionName)}</strong>` : ''
         }.</p>
         <table role="presentation" style="margin:20px 0;border-collapse:collapse">
           <tr><td style="padding:6px 14px 6px 0;color:#94a3b8">Username</td><td style="padding:6px 0;color:#ffffff;font-family:monospace">${escapeHtml(input.username)}</td></tr>
           <tr><td style="padding:6px 14px 6px 0;color:#94a3b8">Temporary password</td><td style="padding:6px 0;color:#ffffff;font-family:monospace">${escapeHtml(input.password)}</td></tr>
         </table>
         <p style="margin:24px 0">
           <a href="${appUrl()}/login" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#f59e0b;color:#111827;font-weight:700;text-decoration:none">Sign in</a>
         </p>
         <p style="font-size:13px;color:#94a3b8">Please change this password after your first sign-in.</p>`,
    );
    return sendMail({
        to: [input.to],
        subject: 'Your OpenMusabaqa judge account',
        html,
        text: `Judge account\nUsername: ${input.username}\nPassword: ${input.password}\nSign in: ${appUrl()}/login`,
        createdById: input.createdById,
    });
}

export async function sendTransactionalEmail(input: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    createdById?: string;
}): Promise<EmailResult> {
    const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
    return sendMail({
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        createdById: input.createdById,
    });
}

export async function sendBulkEmail(input: {
    to: string[];
    subject: string;
    html: string;
    text?: string;
    createdById?: string;
}): Promise<EmailResult> {
    const recipients = [...new Set(input.to.filter(Boolean))];
    if (recipients.length === 0) {
        return { ok: false, provider: 'none', skipped: true, detail: 'No recipients with an email address' };
    }
    return sendMail({
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        kind: 'BULK',
        createdById: input.createdById,
    });
}

async function sendMail(input: MailInput): Promise<EmailResult> {
    const provider = input.kind === 'BULK' && isBrevoConfigured() ? 'brevo' : transactionalProvider();
    const result = await deliver(provider, input);
    await logDelivery(provider, input, result);
    return result;
}

async function deliver(provider: Provider, input: MailInput): Promise<EmailResult> {
    try {
        if (provider === 'resend') return await deliverResend(input);
        if (provider === 'brevo') return await deliverBrevo(input);
        if (provider === 'smtp') return await deliverSmtp(input);
        console.info(`[email:console] "${input.subject}" -> ${input.to.join(', ')}`);
        return { ok: true, provider: 'console', skipped: true, detail: 'Email provider not configured; message logged to the server console' };
    } catch (error) {
        return { ok: false, provider, skipped: false, detail: error instanceof Error ? error.message : 'Unknown provider error' };
    }
}

async function deliverResend(input: MailInput): Promise<EmailResult> {
    if (!resendKey) {
        return { ok: false, provider: 'resend', skipped: true, detail: 'RESEND_API_KEY is not set' };
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
            reply_to: input.replyTo,
        }),
    });
    if (!res.ok) {
        return { ok: false, provider: 'resend', skipped: false, detail: await safeText(res) };
    }
    return { ok: true, provider: 'resend', skipped: false };
}

async function deliverBrevo(input: MailInput): Promise<EmailResult> {
    const result = await sendBrevoTransactional({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
    });
    return {
        ok: result.ok,
        provider: 'brevo',
        skipped: Boolean(result.skipped),
        detail: result.detail,
    };
}

async function deliverSmtp(input: MailInput): Promise<EmailResult> {
    if (!smtpHost) {
        return { ok: false, provider: 'smtp', skipped: true, detail: 'SMTP_HOST is not set' };
    }
    const transport = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });
    await transport.sendMail({
        from,
        to: input.to.join(', '),
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
    });
    return { ok: true, provider: 'smtp', skipped: false };
}

async function logDelivery(provider: string, input: MailInput, result: EmailResult) {
    try {
        await prisma.emailLog.create({
            data: {
                provider: result.provider || provider,
                kind: input.kind ?? 'TRANSACTIONAL',
                subject: input.subject,
                recipients: input.to.length,
                status: result.ok ? 'SENT' : result.skipped ? 'SKIPPED' : 'FAILED',
                detail: result.detail,
                createdById: input.createdById,
            },
        });
    } catch (error) {
        console.error('Unable to record email log:', error);
    }
}

async function safeText(res: Response): Promise<string> {
    try {
        return (await res.text()).slice(0, 500);
    } catch {
        return `HTTP ${res.status}`;
    }
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
