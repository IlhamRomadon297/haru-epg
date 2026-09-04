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

function buildMessages(date, slug, channelName, programs) {
  const nowMs = Date.now();
  const header = `<b>📺 ${channelName}</b>\n<i>${prettyDate(date)}</i>\n`;
  const footer = `\n\n<a href="https://haru-epg.pages.dev/channel/${slug}">🌐 haru-epg.pages.dev</a>`;

  if (programs.length === 0) {
    return [header + '\nJadwal tidak tersedia' + footer];
  }

  const programLines = programs.map((p) => {
    const s = Date.parse(p.start);
    const e = Date.parse(p.end);
    const isCur = Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
    const icon = isCur ? '🔴' : '•';
    return `${icon} <b>${formatTime(p.start)} – ${formatTime(p.end)}</b> ${p.title}`;
  });

  const fullText = header + '\n' + programLines.join('\n') + footer;

  if (fullText.length <= TG_MAX) {
    return [fullText];
  }

  const chunks = [];
  let currentChunk = header + '\n';
  let partNum = 1;

  for (const line of programLines) {
    const testChunk = currentChunk + line + '\n' + footer;
    if (testChunk.length > TG_MAX - 20) {
      currentChunk += `\n➡️ <i>lanjut part ${partNum + 1}...</i>`;
      chunks.push(currentChunk.trim());
      partNum++;
      currentChunk = `<b>📺 ${channelName}</b> (part ${partNum})\n<i>${prettyDate(date)}</i>\n\n`;
    }
    currentChunk += line + '\n';
  }

  currentChunk += '\n' + footer;
  chunks.push(currentChunk.trim());

  return chunks;
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

    if (!data?.channel) {
      console.log(`  SKIP (no data)`);
      continue;
    }

    const ch = data.channel;
    console.log(`  ${ch.name}: ${ch.programs.length} programs`);

    if (ch.programs.length === 0) {
      console.log(`  SKIP (0 programs)`);
      continue;
    }

    const messages = buildMessages(date, slug, ch.name, ch.programs);
    console.log(`  → ${messages.length} message(s), sizes: ${messages.map((m) => m.length).join(', ')}`);

    for (let i = 0; i < messages.length; i++) {
      const body = {
        chat_id: config.chat_id,
        text: messages[i],
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      if (config.message_thread_id) {
        body.message_thread_id = config.message_thread_id;
      }

      if (i === 0 && config.reply_to_message_id) {
        body.reply_to_message_id = config.reply_to_message_id;
      }

      const result = await telegram('sendMessage', body);

      if (result.ok) {
        const chat = result.result?.chat;
        console.log(`  OK [${i + 1}/${messages.length}] → ${chat?.title ?? '?'} (${chat?.id ?? '?'})`);
      } else {
        console.log(`  FAILED [${i + 1}/${messages.length}]`);
      }

      if (i < messages.length - 1) await sleep(500);
    }

    sent++;
    await sleep(1500);
  }

  console.log(`\nDone: ${sent}/${config.channels.length} channels sent`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
