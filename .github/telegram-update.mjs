import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, 'telegram-config.json'), 'utf-8'));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = 'https://haru-epg.pages.dev';

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

async function fetchSchedule() {
  const date = todayWIB();
  const res = await fetch(`${API_BASE}/api/schedule?date=${date}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return { date, data: await res.json() };
}

function formatTime(iso) {
  return iso?.slice(11, 16) ?? '??:??';
}

function buildChannelMessage(date, ch) {
  const lines = [];
  lines.push(`<b>📺 ${ch.name}</b>`);
  lines.push(`<i>${prettyDate(date)}</i>`);
  lines.push('');

  // Tampilkan program berikutnya (max 8 ke depan dari sekarang)
  const nowMs = Date.now();
  const liveIdx = ch.programs.findIndex((p) => {
    const s = Date.parse(p.start);
    const e = Date.parse(p.end);
    return Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
  });
  const startIdx = liveIdx >= 0 ? liveIdx : ch.programs.findIndex((p) => Date.parse(p.start) > nowMs);
  const upcoming = ch.programs.slice(Math.max(0, startIdx), Math.max(0, startIdx) + 8);

  if (upcoming.length === 0) {
    lines.push(`Jadwal tidak tersedia`);
  } else {
    for (const p of upcoming) {
      const isCur = liveIdx >= 0 && p === ch.programs[liveIdx];
      const icon = isCur ? '🔴' : '•';
      lines.push(`${icon} <b>${formatTime(p.start)} – ${formatTime(p.end)}</b>`);
      lines.push(`  ${p.title}`);
    }
  }

  lines.push('');
  lines.push(`<i>haru-epg.pages.dev</i>`);
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
  console.log('Fetching schedule...');
  const { date, data: schedule } = await fetchSchedule();

  let sent = 0;
  for (const slug of config.channels) {
    const ch = schedule.channels?.find((c) => c.slug === slug);
    if (!ch || ch.programs.length === 0) {
      console.log(`SKIP ${slug} (no data)`);
      continue;
    }

    const text = buildChannelMessage(date, ch);
    console.log(`Sending ${ch.name}...`);

    const body = {
      chat_id: config.chat_id,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    // Kalau ada reply_to_message_id, reply ke itu
    if (config.reply_to_message_id) {
      body.reply_to_message_id = config.reply_to_message_id;
    }

    // Kalau ada message_thread_id (forum topic), kirim ke situ
    if (config.message_thread_id) {
      body.message_thread_id = config.message_thread_id;
    }

    const result = await telegram('sendMessage', body);

    if (result.ok) {
      sent++;
      console.log(`  OK message_id=${result.result.message_id}`);
    } else {
      console.log(`  FAILED`);
    }

    // Delay supaya ngga kena rate limit
    await sleep(1500);
  }

  console.log(`\nDone: ${sent}/${config.channels.length} messages sent`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
