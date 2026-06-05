/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    // 2. Set the routing subpath
    basePath: '/Locked-In',

    // 3. CRUCIAL: Directs the browser precisely to your styling sheets (note the trailing slash)
    assetPrefix: '/Locked-In/',

    // 4. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;