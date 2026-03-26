import type { NextConfig } from "next";

function getApiProxyDestination(target: string) {
  const normalizedTarget = target.trim().replace(/\/+$/, "");

  if (normalizedTarget.endsWith("/api")) {
    return `${normalizedTarget}/:path*`;
  }

  return `${normalizedTarget}/api/:path*`;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.50.41",
  ],
  async rewrites() {
    const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET?.trim();

    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: getApiProxyDestination(apiProxyTarget),
      },
    ];
  },
};

export default nextConfig;
