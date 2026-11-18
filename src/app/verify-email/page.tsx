import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-gold-500" size={36} />
                </main>
            }
        >
            <VerifyEmailClient />
        </Suspense>
    );
}
