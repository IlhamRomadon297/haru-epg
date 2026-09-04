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

function buildMessage(date, schedule) {
  const lines = [];
  lines.push(`<b>📺 Jadwal TV Hari Ini</b>`);
  lines.push(`<i>${prettyDate(date)}</i>`);
  lines.push('');

  for (const slug of config.channels) {
    const ch = schedule.channels?.find((c) => c.slug === slug);
    if (!ch) {
      lines.push(`<b>${slug}</b> — tidak tersedia`);
      lines.push('');
      continue;
    }

    const now = ch.now;
    const next = ch.next;

    if (now) {
      lines.push(`🔴 <b>${ch.name}</b>`);
      lines.push(`  ▸ ${now.title}`);
      lines.push(`  ${formatTime(now.start)} – ${formatTime(now.end)} WIB`);
    } else if (next) {
      lines.push(`⚪ <b>${ch.name}</b>`);
      lines.push(`  ▸ ${next.title}`);
      lines.push(`  ${formatTime(next.start)} – ${formatTime(next.end)} WIB`);
    } else {
      lines.push(`⚫ <b>${ch.name}</b>`);
      lines.push(`  Jadwal tidak tersedia`);
    }
    lines.push('');
  }

  lines.push(`<i>Update otomatis jam 7:00 WIB · haru-epg.pages.dev</i>`);
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

async function main() {
  console.log('Fetching schedule...');
  const { date, data: schedule } = await fetchSchedule();

  const text = buildMessage(date, schedule);
  console.log('Message preview:\n' + text.replace(/<[^>]+>/g, ''));

  // Kirim pesan baru sebagai reply ke pinned message
  const result = await telegram('sendMessage', {
    chat_id: config.chat_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_to_message_id: config.reply_to_message_id,
  });

  if (result.ok) {
    console.log(`Message sent! message_id=${result.result.message_id}`);
  } else {
    console.error('Failed to send message');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
