import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const user = await getSession();
    if (!user) redirect('/login');
    if (user.role !== 'ADMIN') redirect(homeForRole(user.role));

    return (
        <AdminDashboard
            user={{
                username: user.username,
                displayName: user.displayName,
            }}
        />
    );
}
