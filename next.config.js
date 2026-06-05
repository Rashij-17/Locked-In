const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Force Next.js to compile your views into static HTML/CSS/JS assets
  output: 'export', 
  
  // 2. Map the base path to match your exact GitHub repository capitalization only in production
  basePath: isProd ? '/Locked-In' : '', 
  
  // 3. Disable server-dependent image optimization processing
  images: {
    unoptimized: true, 
  },
};

module.exports = nextConfig;
