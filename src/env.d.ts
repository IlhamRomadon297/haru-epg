/// <reference types="astro/client" />

type CloudflareEnv = {
  // Environment variables
  GOOGLE_SHEET_ID?: string;
  GOOGLE_API_KEY?: string;
  CACHE_TTL?: string;
  // D1 database binding (database "haru-epg")
  DB?: unknown;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}