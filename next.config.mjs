import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        async rewrites() {
                return [
                        {
                                source: '/api/proxy/:path*',
                                destination: `${process.env.PROXY_TARGET_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`,
                        },
                ];
        },
};

export default withNextIntl(nextConfig);
