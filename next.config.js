/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5001',
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig