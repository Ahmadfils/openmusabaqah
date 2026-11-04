import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth';
import JudgeConsole from './JudgeConsole';

export const dynamic = 'force-dynamic';

export default async function JudgePage() {
    const user = await getSession();
    if (!user) redirect('/login');
    if (user.role !== 'JUDGE') redirect(homeForRole(user.role));

    return (
        <JudgeConsole
            user={{
                username: user.username,
                displayName: user.displayName,
            }}
        />
    );
}
