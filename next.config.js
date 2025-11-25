/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API base URL is available on both server and client
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL,
  },
}

module.exports = nextConfig
