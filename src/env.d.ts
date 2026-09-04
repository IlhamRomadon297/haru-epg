/// <reference types="astro/client" />

type CloudflareEnv = {
  // Environment variables
  GOOGLE_SHEET_ID?: string;
  GOOGLE_API_KEY?: string;
  CACHE_TTL?: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}