/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  transpilePackages: ['@react-pdf/renderer'],
}

export default nextConfig
