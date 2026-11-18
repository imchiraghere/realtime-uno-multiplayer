import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.dicebear.com'],
  },
};

export default nextConfig;
