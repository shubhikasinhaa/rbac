import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export -> S3 + CloudFront (arch.md S14, Decision 3).
  // No SSR, no server-side secrets in the bundle.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
