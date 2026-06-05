/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    // 2. Set the routing subpath
    basePath: '/Locked-In',

    // 3. Add trailing slashes to paths so GitHub Pages can serve /route/index.html
    trailingSlash: true,

    // 4. CRUCIAL: Directs the browser precisely to your styling sheets (note the trailing slash)
    assetPrefix: '/Locked-In/',

    // 5. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;