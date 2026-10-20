import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-api-prod.verdent.ai/p/p8b6a94bfa5b22a03d9b8",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMTA0NDAwNDcxLCJpYXQiOjE3ODg3ODEyNzEsImlzcyI6InN1cGFiYXNlIiwicHJvamVjdF9yZWYiOiJwOGI2YTk0YmZhNWIyMmEwM2Q5YjgiLCJyb2xlIjoiYW5vbiJ9.9jvzr3qJ3qR3ItSicAK9EnWESq-SXUllvhomMmLsjig",
  },
  allowedDevOrigins: ["*.preview.verdent.ai"],
};

export default nextConfig;