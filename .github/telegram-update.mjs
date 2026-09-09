import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, 'telegram-config.json'), 'utf-8'));

const requestedChannels = (process.env.TELEGRAM_CHANNELS ?? '').trim();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = 'https://haru-epg.pages.dev';
const TG_MAX = 4096;
const MAX_PHOTO_LINES = 28;

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

function escapeXml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

function plainLine(p) {
  const time = `${formatTime(p.start)} – ${formatTime(p.end)}`;
  const title = String(p.title ?? '').slice(0, 52);
  return `• ${time} ${title}`;
}

function chunkText(date, slug, channelName, htmlLines, { withHeader = true, startPart = 1, note = '' } = {}) {
  if (htmlLines.length === 0) return [];
  const header = withHeader ? `<b>📺 ${channelName}</b>\n<i>${prettyDate(date)}</i>\n` : '';
  const footer = `\n\n🌐 <b>Jadwal Selengkapnya:</b> <a href="https://haru-epg.pages.dev/channel/${slug}">Klik disini</a>`;
  const lead = note ? `\n<i>${note}</i>\n` : '';

  const fullText = header + lead + htmlLines.join('\n') + footer;
  if (fullText.length <= TG_MAX) return [fullText];

  const chunks = [];
  let currentChunk = header + lead;
  let partNum = startPart;
  for (const line of htmlLines) {
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

function buildScheduleSVG({ name, dateLabel, logoDataUrl, lines }) {
  const W = 620;
  const HDR = 96;
  const LH = 24;
  const FOOT = 34;
  const H = HDR + lines.length * LH + FOOT;
  const brand = '#ea580c';
  const dark = '#111827';
  const muted = '#6b7280';
  const border = '#e5e7eb';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="${HDR}" fill="#fff7ed"/>`;
  if (logoDataUrl) {
    svg += `<image href="${logoDataUrl}" x="22" y="26" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>`;
  }
  svg += `<text x="${logoDataUrl ? 84 : 22}" y="40" font-size="20" font-weight="bold" font-family="DejaVu Sans" fill="${dark}">${escapeXml(name)}</text>
  <text x="${logoDataUrl ? 84 : 22}" y="64" font-size="13" font-family="DejaVu Sans" fill="${muted}">${escapeXml(dateLabel)}</text>
  <line x1="22" y1="${HDR}" x2="${W - 22}" y2="${HDR}" stroke="${border}" stroke-width="1"/>`;

  lines.forEach((line, i) => {
    const y = HDR + 20 + i * LH;
    const m = line.match(/^•\s+([\d:]+)\s+–\s+([\d:]+)\s+(.*)$/);
    if (m) {
      const time = m[1] + ' – ' + m[2];
      let title = m[3];
      const est = time.length * 8 + title.length * 7.5 + 30;
      if (est > W - 40) {
        const max = Math.floor((W - 40 - time.length * 8 - 24) / 7.5);
        title = title.slice(0, Math.max(8, max)) + '…';
      }
      svg += `<text x="24" y="${y}" font-size="13.5" font-family="DejaVu Sans" fill="${dark}">• <tspan font-weight="bold">${escapeXml(time)}</tspan> ${escapeXml(title)}</text>`;
    } else {
      svg += `<text x="24" y="${y}" font-size="13.5" font-family="DejaVu Sans" fill="${dark}">${escapeXml(line.slice(0, 60))}</text>`;
    }
  });

  svg += `<line x1="22" y1="${H - FOOT}" x2="${W - 22}" y2="${H - FOOT}" stroke="${border}" stroke-width="1"/>
  <text x="24" y="${H - 14}" font-size="12" font-family="DejaVu Sans" fill="${brand}">Haru EPG · haru-epg.pages.dev/channel</text>
</svg>`;
  return svg;
}

async function renderSchedulePNG({ name, dateLabel, logoDataUrl, lines, maxLines = MAX_PHOTO_LINES }) {
  if (!lines.length) return null;
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const svg = buildScheduleSVG({ name, dateLabel, logoDataUrl, lines: lines.slice(0, maxLines) });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 620 } }).render().asPng();
    return Buffer.from(png);
  } catch (e) {
    console.error('  render PNG failed:', String(e));
    return null;
  }
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

async function telegramUploadPhoto(base, png, caption) {
  const fd = new FormData();
  fd.append('photo', new Blob([png], { type: 'image/png' }), 'schedule.png');
  fd.append('caption', caption ?? '');
  fd.append('parse_mode', 'HTML');
  for (const [k, v] of Object.entries(base)) fd.append(k, String(v));
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
  const json = await res.json();
  if (!json.ok) {
    console.error(`Telegram sendPhoto failed:`, JSON.stringify(json));
  }
  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getLogoDataUrl(logoPath) {
  if (!logoPath) return null;
  const url = logoPath.startsWith('http') ? logoPath : API_BASE + logoPath;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

async function main() {
  const date = todayWIB();
  const channels = await loadChannels();
  console.log(`Date: ${date}`);
  console.log(`Chat ID: ${config.chat_id}`);
  console.log(`Channels: ${channels.join(', ')}\n`);

  let sent = 0;
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
    const logoDataUrl = await getLogoDataUrl(ch.logo);
    const png = await renderSchedulePNG({
      name: ch.name,
      dateLabel: prettyDate(date),
      logoDataUrl,
      lines: ch.programs.map(plainLine),
      maxLines: MAX_PHOTO_LINES,
    });

    let renderedPhoto = false;
    if (png) {
      const caption = `<b>📺 ${ch.name}</b>\n<i>${prettyDate(date)}</i>`;
      const photoResult = await telegramUploadPhoto(base, png, caption);
      renderedPhoto = photoResult.ok;
      console.log(`  Foto ${renderedPhoto ? 'OK' : 'FAILED'}` + (renderedPhoto ? ` (${Math.min(ch.programs.length, MAX_PHOTO_LINES)}/${ch.programs.length} baris)` : ''));
      await sleep(1200);
    }

    const remaining = lines.slice(renderedPhoto ? MAX_PHOTO_LINES : 0);
    const messages = renderedPhoto
      ? chunkText(date, slug, ch.name, remaining, { withHeader: false, note: 'Lanjutan jadwal' })
      : chunkText(date, slug, ch.name, lines, { withHeader: true });
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
      }

      if (i < messages.length - 1) await sleep(500);
    }

    sent++;
    await sleep(1500);
  }

  console.log(`\nDone: ${sent}/${channels.length} channels sent`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});