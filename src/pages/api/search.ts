import type { APIRoute } from 'astro';
import { getDaySchedule } from '../../lib/epg';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const env = (locals as unknown as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const date = url.searchParams.get('date') ?? undefined;
  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ q, results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const day = await getDaySchedule(env, date);
  const results = day.channels
    .flatMap((c) => c.programs)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.channelName.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    )
    .slice(0, 60);
  return new Response(JSON.stringify({ q, date: day.date, count: results.length, results }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  });
};
