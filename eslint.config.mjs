import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
    ...nextVitals,
    {
        ignores: ['.next/**', 'node_modules/**', 'public/sw.js', 'public/workbox-*.js', 'next-env.d.ts'],
    },
];

export default config;
