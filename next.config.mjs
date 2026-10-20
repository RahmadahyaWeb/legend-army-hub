/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/lelang",
        destination: "/auction",
        permanent: true,
      },
      {
        source: "/admin/lelang",
        destination: "/admin/auction",
        permanent: true,
      },
      {
        source: "/api/lelang/:path*",
        destination: "/api/auction/:path*",
        permanent: true,
      },
      {
        source: "/api/admin/lelang/:path*",
        destination: "/api/admin/auction/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
