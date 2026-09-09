import type { APIRoute } from 'astro';
import { CHANNELS } from '../../../lib/channels';

export const prerender = false;

const DEFAULT_CHANNELS = [
  'animax',
  'aniplus',
  'hbo',
  'hbo-hits',
  'hbo-family',
  'hbo-signature',
  'nickelodeon',
  'nickelodeon-jr',
  'dreamworks',
  'axn',
  'cbeebies',
  'rock-action',
  'galaxy-premium',
  'imc',
  'vision-prime',
  'mentari-tv',
  'rtv',
  'trans7',
  'trans-tv',
  'mnctv',
  'rcti',
  'gtv',
  'antv',
];

const TARGET_CHAT = -1003974729570;
const TARGET_TOPIC = 394;

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as unknown as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
  let channels: string[] | null = null;
  let source = 'default';
  try {
    const db = (env as unknown as { DB?: { prepare(s: string): unknown } }).DB as any;
    if (db) {
      const res = await db
        .prepare('SELECT channels FROM telegram_channels WHERE chat_id = ? AND message_thread_id = ?')
        .bind(TARGET_CHAT, TARGET_TOPIC)
        .first<{ channels: string }>();
      if (res?.channels) {
        const parsed = JSON.parse(res.channels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          channels = parsed;
          source = 'd1';
        }
      }
    }
  } catch (e) {
    console.error('telegram/channels read failed:', String(e));
  }
  const finalChannels = channels ?? DEFAULT_CHANNELS;
  return new Response(
    JSON.stringify({
      channels: finalChannels,
      knownSlugs: CHANNELS.map((c) => c.slug),
      source,
    }),
    {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    },
  );
};