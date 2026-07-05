/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    trailingSlash: true,

    // 2. Set basePath and assetPrefix for GitHub Pages (/Locked-In repo)
    //    Only applied in production so local dev works at http://localhost:3000
    basePath: isProd ? '/Locked-In' : '',
    assetPrefix: isProd ? '/Locked-In/' : '',

    // 3. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;