import type {NextConfig} from 'next';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.mpbfoundationhsschool.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    // This is to allow cross-origin requests in development.
    // The value is the domain of your Firebase Studio workspace.
    allowedDevOrigins: ["6000-firebase-studio-1762101390883.cluster-c36dgv2kibakqwbbbsgmia3fny.cloudworkstations.dev"]
  }
};

export default withPWA(nextConfig);
