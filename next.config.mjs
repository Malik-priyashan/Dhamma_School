import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin();
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
        async headers() {
                return [{
                        source: '/:path*',
                        headers: [
                                { key: 'X-Content-Type-Options', value: 'nosniff' },
                                { key: 'X-Frame-Options', value: 'DENY' },
                                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                                { key: 'Content-Security-Policy', value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'" },
                                ...(process.env.NODE_ENV === 'production'
                                        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
                                        : []),
                        ],
                }];
        },
        turbopack: {
                root: projectRoot,
        },
        outputFileTracingRoot: projectRoot,
        images: {
                remotePatterns: [
                        {
                                protocol: 'https',
                                hostname: 'i.ytimg.com',
                                port: '',
                                pathname: '/vi/**',
                        },
                ],
        },
};

export default withNextIntl(nextConfig);
