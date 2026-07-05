/** @type {import('next').NextConfig} */

const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    trailingSlash: true,

    // Note: basePath and assetPrefix are automatically injected by
    // actions/configure-pages@v5 in the GitHub Actions workflow.
    // Do NOT set them manually here to avoid double-prefix conflicts.

    // 2. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;