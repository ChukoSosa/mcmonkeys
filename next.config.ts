import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/": ["./prisma/**/*", "./public/**/*"],
  },
};

export default nextConfig;
