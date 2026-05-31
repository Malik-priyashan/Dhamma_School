import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin();
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
