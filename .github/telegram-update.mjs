import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, 'telegram-config.json'), 'utf-8'));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = 'https://haru-epg.pages.dev';
const TG_MAX = 4096;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

function todayWIB() {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

function prettyDate(dateISO) {
  const d = new Date(`${dateISO}T12:00:00+07:00`);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

async function fetchChannel(slug, date) {
  const res = await fetch(`${API_BASE}/api/channel/${slug}?date=${date}`);
  if (!res.ok) {
    console.error(`  API ${res.status} for ${slug}`);
    return null;
  }
  return res.json();
}

function formatTime(iso) {
  return iso?.slice(11, 16) ?? '??:??';
}

function buildChannelMessage(date, ch) {
  const lines = [];
  lines.push(`<b>📺 ${ch.name}</b>`);
  lines.push(`<i>${prettyDate(date)}</i>`);
  lines.push('');

  const nowMs = Date.now();
  const programs = ch.channel?.programs ?? ch.programs ?? [];

  if (programs.length === 0) {
    lines.push(`Jadwal tidak tersedia`);
  } else {
    for (const p of programs) {
      const s = Date.parse(p.start);
      const e = Date.parse(p.end);
      const isCur = Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
      const icon = isCur ? '🔴' : '•';
      lines.push(`${icon} <b>${formatTime(p.start)} – ${formatTime(p.end)}</b> ${p.title}`);
    }
  }

  lines.push('');
  lines.push(`Jadwal Selengkapnya: <a href="https://haru-epg.pages.dev/channel/${ch.slug}">haru-epg.pages.dev</a>`);
  return lines.join('\n');
}

async function telegram(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`Telegram ${method} failed:`, JSON.stringify(json));
  }
  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const date = todayWIB();
  console.log(`Date: ${date}`);
  console.log(`Chat ID: ${config.chat_id}`);
  console.log(`Channels: ${config.channels.join(', ')}\n`);

  let sent = 0;
  for (const slug of config.channels) {
    console.log(`Fetching ${slug}...`);
    const data = await fetchChannel(slug, date);

    if (!data) {
      console.log(`  SKIP (no data)`);
      continue;
    }

    const ch = { slug, name: data.channel?.name ?? slug, programs: data.channel?.programs ?? [] };
    console.log(`  ${ch.name}: ${ch.programs.length} programs`);

    if (ch.programs.length === 0) {
      console.log(`  SKIP (0 programs)`);
      continue;
    }

    const text = buildChannelMessage(date, data);

    if (text.length > TG_MAX) {
      console.log(`  WARN: message ${text.length} chars, trimming...`);
    }

    const body = {
      chat_id: config.chat_id,
      text: text.slice(0, TG_MAX),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    if (config.message_thread_id) {
      body.message_thread_id = config.message_thread_id;
    }

    const result = await telegram('sendMessage', body);

    if (result.ok) {
      sent++;
      const chat = result.result?.chat;
      console.log(`  OK → ${chat?.title ?? '?'} (${chat?.id ?? '?'}) msg_id=${result.result.message_id}`);
    } else {
      console.log(`  FAILED`);
    }

    await sleep(1500);
  }

  console.log(`\nDone: ${sent}/${config.channels.length} messages sent`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
