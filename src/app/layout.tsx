import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://openmusabaqa.org').replace(/\/$/, '');
const siteTitle = 'OpenMusabaqa – Quran Competition Platform';
const siteDescription =
    'Real-time Quran competition management for organizers, judges and reciters: independent judging, public registration, live stages and transparent leaderboards.';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: siteTitle,
        template: '%s · OpenMusabaqa',
    },
    description: siteDescription,
    applicationName: 'OpenMusabaqa',
    keywords: [
        'Quran competition',
        'musabaqa',
        'Quran recitation',
        'tajweed competition',
        'Quran memorization',
        'Islamic competition platform',
        'competition judging software',
    ],
    authors: [{ name: 'OpenMusabaqa' }],
    creator: 'OpenMusabaqa',
    publisher: 'OpenMusabaqa',
    category: 'education',
    alternates: {
        canonical: '/',
    },
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
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        url: '/',
        siteName: 'OpenMusabaqa',
        locale: 'en_US',
        title: siteTitle,
        description: siteDescription,
        images: [
            {
                url: '/gallery/og-image.png',
                width: 1200,
                height: 630,
                alt: 'OpenMusabaqa – Quran Competition Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: siteDescription,
        images: ['/gallery/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            url: siteUrl,
            name: 'OpenMusabaqa',
            description: siteDescription,
            publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
            '@type': 'Organization',
            '@id': `${siteUrl}/#organization`,
            name: 'OpenMusabaqa',
            url: siteUrl,
            logo: `${siteUrl}/gallery/openMusabaqa-logo-white.png`,
            email: 'partners@openmusabaqa.org',
        },
    ],
};

export const viewport: Viewport = {
    themeColor: '#14b8a6',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" dir="ltr">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
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
