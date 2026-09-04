import type { APIRoute } from 'astro';
import { getChannelSchedule } from '../../../lib/epg';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const env = (locals as unknown as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const date = url.searchParams.get('date') ?? undefined;
  const result = await getChannelSchedule(env, params.slug ?? '', date);
  if (!result) {
    return new Response(JSON.stringify({ error: 'Channel tidak ditemukan' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
  });
};
