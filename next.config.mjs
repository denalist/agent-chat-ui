import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  const config = {
    experimental: {
      serverActions: {
        bodySizeLimit: "10mb",
      },
    },
    // Ensure proper handling of API routes in Amplify
    trailingSlash: false,
    // Disable static export for Amplify deployment
    output: undefined,
  };

  // Only enable static export for S3 deployment
  const shouldExport =
    process.env.NEXT_BUILD_TARGET === "static" ||
    process.env.NEXT_OUTPUT === "export";

  if (shouldExport) {
    config.output = "export";
    config.trailingSlash = true;
  }

  return config;
};

export default nextConfig;
