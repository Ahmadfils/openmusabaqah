import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SuperAdminConsole from './SuperAdminConsole';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
    const user = await getSession();
    if (!user) redirect('/login');
    if (user.role !== 'SUPERADMIN') redirect('/');

    return <SuperAdminConsole user={{ username: user.username, displayName: user.displayName }} />;
}
