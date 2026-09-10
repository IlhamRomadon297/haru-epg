import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, 'telegram-config.json'), 'utf-8'));

const requestedChannels = (process.env.TELEGRAM_CHANNELS ?? '').trim();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = 'https://haru-epg.pages.dev';
const TG_MAX = 4096;
const CAPTION_MAX = 1000;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

function todayWIB() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
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

function formatTime(iso) {
  return iso?.slice(11, 16) ?? '??:??';
}

async function fetchChannel(slug, date) {
  const res = await fetch(`${API_BASE}/api/channel/${slug}?date=${date}`);
  if (!res.ok) {
    console.error(`  API ${res.status} for ${slug}`);
    return null;
  }
  return res.json();
}

async function loadChannels() {
  if (requestedChannels) {
    return requestedChannels.split(',').map((s) => s.trim()).filter(Boolean);
  }
  try {
    const res = await fetch(`${API_BASE}/api/telegram/channels`);
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.channels) && j.channels.length > 0) return j.channels;
    }
  } catch {
    /* fallback ke config */
  }
  return config.channels;
}

function htmlLine(p) {
  return `• <b>${formatTime(p.start)} – ${formatTime(p.end)}</b> ${p.title}`;
}

function headerText(date, channelName) {
  return `<b>📺 ${channelName}</b>\n<i>${prettyDate(date)}</i>`;
}

function footerText(slug) {
  return `\n\n🌐 <b>Jadwal Selengkapnya:</b> <a href="https://haru-epg.pages.dev/channel/${slug}">Klik disini</a>`;
}

// Pecah pesan (pakai caption foto sebagai bagian pertama bila logo ada).
// Mengembalikan { caption: string|null, rest: string[] } — caption berisi header+sebanyak
// mungkin baris (≤ CAPTION_MAX); sisanya jadi pesan teks lanjutan.
function splitSchedule(date, slug, channelName, lines) {
  const header = headerText(date, channelName);
  const footer = footerText(slug);

  const full = header + '\n\n' + lines.join('\n') + footer;
  if (full.length <= CAPTION_MAX) {
    return { caption: full, rest: [] };
  }

  // Muatkan ke kapasitas caption (header + baris utuh)
  let current = header + '\n\n';
  let i = 0;
  for (; i < lines.length; i++) {
    const test = current + lines[i] + '\n';
    if (test.length > CAPTION_MAX - 40) break;
    current = test;
  }
  const ended = i >= lines.length;
  const ending = ended ? footer : '\n➡️ <i>lanjut di pesan berikut...</i>';
  const caption = (current + ending).slice(0, CAPTION_MAX);
  const rest = lines.slice(i);
  return { caption, rest };
}

// Bagian teks lanjutan (tanpa foto) setelah caption keburu habis atau jika foto gagal.
function textChunksFromLines(date, slug, channelName, lines, { isContinuation = false } = {}) {
  if (lines.length === 0) return [];
  const footer = footerText(slug);

  if (isContinuation) {
    const lead = '<i>Lanjutan jadwal:</i>\n\n';
    const single = lead + lines.join('\n') + footer;
    if (single.length <= TG_MAX) return [single];

    const chunks = [];
    let currentChunk = lead;
    let partNum = 2;
    for (const line of lines) {
      const testChunk = currentChunk + line + '\n' + footer;
      if (testChunk.length > TG_MAX - 30) {
        currentChunk += `\n➡️ <i>lanjut part ${partNum}...</i>`;
        chunks.push(currentChunk.trim());
        currentChunk = `<b>📺 ${channelName}</b> (part ${partNum})\n<i>${prettyDate(date)}</i>\n\n`;
        partNum++;
      }
      currentChunk += line + '\n';
    }
    currentChunk += '\n' + footer;
    chunks.push(currentChunk.trim());
    return chunks;
  }

  // Normal text message (jika tidak ada foto / foto gagal kirim)
  const header = headerText(date, channelName);
  const fullText = header + '\n\n' + lines.join('\n') + footer;
  if (fullText.length <= TG_MAX) return [fullText];

  const chunks = [];
  let currentChunk = header + '\n\n';
  let partNum = 1;
  for (const line of lines) {
    const testChunk = currentChunk + line + '\n' + footer;
    if (testChunk.length > TG_MAX - 30) {
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
  const json = await withRetry(async () => {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }, method);
  if (!json.ok) {
    console.error(`Telegram ${method} failed:`, JSON.stringify(json));
  }
  return json;
}

async function telegramUploadPhoto(base, logoBytes, caption) {
  const json = await withRetry(async () => {
    const fd = new FormData();
    fd.append('photo', new Blob([logoBytes], { type: 'image/png' }), 'logo.png');
    if (caption) fd.append('caption', caption);
    fd.append('parse_mode', 'HTML');
    for (const [k, v] of Object.entries(base)) fd.append(k, String(v));
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    return res.json();
  }, 'sendPhoto');
  if (!json.ok) {
    console.error(`Telegram sendPhoto failed:`, JSON.stringify(json));
  }
  return json;
}

async function fetchLogo(logoPath) {
  if (!logoPath) return null;
  const url = logoPath.startsWith('http') ? logoPath : API_BASE + logoPath;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Kirim dengan retry bila kena 429 (hormati retry_after dari Telegram).
async function withRetry(fn, label) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const json = await fn();
    if (json?.ok) return json;
    const wait = Number(json?.parameters?.retry_after);
    if (json?.error_code === 429 && attempt < 3) {
      const ms = (Number.isFinite(wait) ? wait : 5) * 1000 + 500;
      console.error(`  429 ${label}, retry dalam ${ms}ms (percobaan ${attempt + 2}/4)`);
      await sleep(ms);
      continue;
    }
    return json;
  }
  return { ok: false };
}

async function main() {
  const date = todayWIB();
  const channels = await loadChannels();
  console.log(`Date: ${date}`);
  console.log(`Chat ID: ${config.chat_id}`);
  console.log(`Channels: ${channels.join(', ')}\n`);

  let sent = 0;
  let failed = 0;
  for (const slug of channels) {
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

    const base = { chat_id: config.chat_id };
    if (config.message_thread_id) base.message_thread_id = config.message_thread_id;

    const lines = ch.programs.map(htmlLine);
    const logoBytes = await fetchLogo(ch.logo);

    let photoSent = false;
    let rest = [];
    if (logoBytes) {
      const { caption, rest: r } = splitSchedule(date, slug, ch.name, lines);
      const photoResult = await telegramUploadPhoto(base, logoBytes, caption);
      photoSent = photoResult.ok;
      if (photoSent) rest = r;
      console.log(`  Logo+caption ${photoSent ? 'OK' : 'FAILED'} (${photoSent ? caption.length + ' char caption' : ''})`);
      await sleep(2000);
    }

    let messages = [];
    if (photoSent) {
      if (rest.length > 0) {
        messages = textChunksFromLines(date, slug, ch.name, rest, { isContinuation: true });
      }
    } else {
      messages = textChunksFromLines(date, slug, ch.name, lines, { isContinuation: false });
    }
    console.log(`  → ${messages.length} text message(s), sizes: ${messages.map((m) => m.length).join(', ')}`);

    for (let i = 0; i < messages.length; i++) {
      const body = {
        ...base,
        text: messages[i],
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      if (i === 0 && config.reply_to_message_id) {
        body.reply_to_message_id = config.reply_to_message_id;
      }

      const result = await telegram('sendMessage', body);

      if (result.ok) {
        const chat = result.result?.chat;
        console.log(`  OK [${i + 1}/${messages.length}] → ${chat?.title ?? '?'} (${chat?.id ?? '?'})`);
      } else {
        console.log(`  FAILED [${i + 1}/${messages.length}]`);
        failed++;
      }

      if (i < messages.length - 1) await sleep(1000);
    }

    sent++;
    await sleep(2500);
  }

  console.log(`\nDone: ${sent}/${channels.length} channels, text gagal: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});