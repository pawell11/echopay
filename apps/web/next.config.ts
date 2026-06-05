import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@vantagepay/ui",
    "@vantagepay/hooks",
    "@vantagepay/utils",
    "@vantagepay/api",
    "@vantagepay/config",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-phantom",
    "@solana/wallet-adapter-solflare",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      encoding: false,
    };
    return config;
  },
  images: {
    domains: ["vantagepay.cards"],
  },
};

export default nextConfig;
