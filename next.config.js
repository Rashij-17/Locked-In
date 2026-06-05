
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    // 1. Tell Next.js to compile into static HTML/CSS/JS
    output: 'export',

    // 2. Set the base path (Match your exact GitHub repository name) only in production
    basePath: isProd ? '/Locked-In' : '',

    // 3. Disable default image optimization (GitHub Pages can't process it server-side)
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;