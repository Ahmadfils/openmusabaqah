import type { Metadata } from 'next';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = {
    title: 'Unsubscribe',
    robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string | string[]; token?: string | string[] }>;
}) {
    const params = await searchParams;
    const email = typeof params.email === 'string' ? params.email : '';
    const token = typeof params.token === 'string' ? params.token : '';

    return <UnsubscribeClient initialEmail={email} token={token} />;
}
