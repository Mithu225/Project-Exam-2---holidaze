import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    domains: [
      'source.unsplash.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'api.noroff.dev',
      'v2.api.noroff.dev',
      'res.cloudinary.com',
      'images.pexels.com',
      'cdn.pixabay.com'
    ]
  }
};


export default nextConfig;
