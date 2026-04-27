/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Static export can't optimize remote images at runtime — use unoptimized
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
