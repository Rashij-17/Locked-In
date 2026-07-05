/** @type {import('next').NextConfig} */

const nextConfig = {
    // 1. Force static export HTML compilation
    output: 'export',

    // GitHub Pages project site: served at /Locked-In/
    // Hardcoded here so both local builds and CI produce identical output.
    // IMPORTANT: Remove static_site_generator: next from the workflow to
    // prevent actions/configure-pages from double-patching these values.
    basePath: '/Locked-In',
    assetPrefix: '/Locked-In/',

    trailingSlash: true,

    // 2. Turn off server image formatting dependencies
    images: {
        unoptimized: true,
    },

    // 3. Expose base path to client-side code (e.g. SW registration, fetch calls)
    env: {
        NEXT_PUBLIC_BASE_PATH: '/Locked-In',
    },
};

module.exports = nextConfig;