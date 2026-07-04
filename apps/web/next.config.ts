import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Both shared packages export raw TypeScript (main = ./src/index.ts), so Next must transpile them.
  transpilePackages: ['@viagem/core', '@viagem/supabase'],
};

export default nextConfig;
