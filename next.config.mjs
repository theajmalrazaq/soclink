/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/events/create', destination: '/events/new', permanent: true },
      { source: '/emails/send', destination: '/emails/compose', permanent: true },
      { source: '/emails/customize', destination: '/settings', permanent: true },
      { source: '/settings/email', destination: '/settings', permanent: true },
      { source: '/settings/emails', destination: '/settings', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
