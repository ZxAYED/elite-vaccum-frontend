import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "primetechsupport.com",
      },
    ],
  },
};

export default nextConfig;