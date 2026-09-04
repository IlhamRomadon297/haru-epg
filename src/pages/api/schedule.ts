import type { APIRoute } from 'astro';
import { getDaySchedule } from '../../lib/epg';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const env = (locals as unknown as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  const date = url.searchParams.get('date') ?? undefined;
  const category = url.searchParams.get('category');
  try {
    const day = await getDaySchedule(env, date);
    const channels =
      category && ['nasional', 'paytv', 'internasional'].includes(category)
        ? day.channels.filter((c) => c.category === category)
        : day.channels;
    return new Response(JSON.stringify({ ...day, channels }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Gagal memuat jadwal', detail: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
