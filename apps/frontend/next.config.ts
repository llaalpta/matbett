import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/trpc/:path*',
        destination: `http://localhost:${process.env.NEXT_PUBLIC_API_PORT || 3001}/trpc/:path*`,
      },
    ];
  },
};

export default nextConfig;
