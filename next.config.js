/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    // 2. Set the routing subpath only in production
    basePath: isProd ? '/Locked-In' : '',
    trailingSlash: true,
    // 5. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;