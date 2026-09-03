/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
