/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les photos passent par les actions serveur : réduites dans le navigateur, elles restent sous 5 Mo.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
