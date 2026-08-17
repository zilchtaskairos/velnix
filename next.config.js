/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // AniList serves images from its own CDN (https://media.anilist.co) and a
    // shared S4 image host. Both are public read-only image hosts, so it is
    // safe to allow the Next.js image optimizer to fetch from them.
    remotePatterns: [
      { protocol: "https", hostname: "media.anilist.co" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "cdn.anilist.co" },
      { protocol: "https", hostname: "**.anilist.co" },
    ],
  },
};

module.exports = nextConfig;
