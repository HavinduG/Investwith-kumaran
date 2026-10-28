import type { NextConfig } from "next";

const wordpressUrl = new URL(process.env.NEXT_PUBLIC_WORDPRESS_URL ?? "http://investwithkamran.local");
// A local WordPress (*.local / localhost) resolves to a private IP, which the
// image optimizer blocks by default. Allow it only for such local hosts.
const isLocalWordPress = /(\.local|localhost|127\.0\.0\.1)$/.test(wordpressUrl.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [new URL(`${wordpressUrl.origin}/wp-content/uploads/**`)],
    dangerouslyAllowLocalIP: isLocalWordPress,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
