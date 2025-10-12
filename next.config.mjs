import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  const config = {
    experimental: {
      serverActions: {
        bodySizeLimit: "10mb",
      },
    },
  };

  if (phase !== PHASE_DEVELOPMENT_SERVER) {
    config.output = "export";
  }

  return config;
};

export default nextConfig;
