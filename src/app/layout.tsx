import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'OpenMusabaqa – Quran Competition Platform',
    description: 'A modern, real-time Quran competition management platform for participants, judges, and administrators.',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/icons/openMusabaqa-icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/openMusabaqa-icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: '/icons/openMusabaqa-icon-180x180.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'OpenMusabaqa',
    },
    openGraph: {
        title: 'OpenMusabaqa – Quran Competition Platform',
        description: 'A modern, real-time Quran competition platform',
        type: 'website',
    },
};

export const viewport: Viewport = {
    themeColor: '#14b8a6',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ar" dir="ltr">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="min-h-screen antialiased">
                {/* Animated background */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-turquoise-950 via-[#052e2b] to-[#0a1a2e]" />
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-turquoise-500/5 blur-[100px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gold-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-turquoise-700/5 blur-[80px]" />
                </div>
                {children}
            </body>
        </html>
    );
}
