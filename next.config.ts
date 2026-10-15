import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16. The CSS rule below wires
  // Tailwind v4 into the Turbopack pipeline (no PostCSS step required).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // `cacheComponents` (Partial Prerendering) is deliberately NOT enabled.
  // See docs/adr/0002-no-cache-components.md for the reasoning.
  typedRoutes: true,
};

export default nextConfig;
