/** @type {import('next').NextConfig} */

const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    trailingSlash: true,
    // 2. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;