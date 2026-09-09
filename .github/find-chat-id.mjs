// Run this to find the correct group chat_id
// Usage: TELEGRAM_BOT_TOKEN=xxx node .github/find-chat-id.mjs

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Set TELEGRAM_BOT_TOKEN env var first');
  process.exit(1);
}

async function api(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  console.log('=== Telegram Chat ID Finder ===\n');

  // 1. Get bot info
  const me = await api('getMe');
  if (!me.ok) {
    console.error('Failed to get bot info:', me);
    process.exit(1);
  }
  console.log(`Bot: @${me.result.username} (ID: ${me.result.id})\n`);

  // 2. Get recent updates to find all chats
  console.log('Fetching recent updates...');
  const updates = await api('getUpdates', { limit: 100, timeout: 0 });
  if (!updates.ok) {
    console.error('Failed to get updates:', updates);
    process.exit(1);
  }

  console.log(`Found ${updates.result.length} recent updates\n`);

  // Collect unique chats + topik (message_thread_id)
  const chats = new Map();
  const topics = new Map();
  for (const u of updates.result) {
    const chat = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat;
    if (chat && !chats.has(chat.id)) {
      chats.set(chat.id, chat);
    }
    const msg = u.message || u.channel_post;
    if (msg?.message_thread_id && msg?.chat?.id) {
      const key = `${msg.chat.id}:${msg.message_thread_id}`;
      if (!topics.has(key)) {
        topics.set(key, {
          chat_id: msg.chat.id,
          thread_id: msg.message_thread_id,
          title: msg.chat.title || msg.chat.username || '(unknown)',
          thread_name: msg.is_topic_message ? `(topik: ${msg.message_thread_id})` : '',
        });
      }
    }
  }

  if (chats.size === 0) {
    console.log('No chats found. Make sure:');
    console.log('1. Bot is added to the group M-L PVT as admin');
    console.log('2. Send at least one message in the group');
    console.log('3. Then run this script again');
    return;
  }

  console.log('=== All Known Chats ===\n');
  for (const [id, chat] of chats) {
    const type = chat.type;
    const title = chat.title || chat.username || chat.first_name || '(unknown)';
    const username = chat.username ? `@${chat.username}` : '(no username)';
    console.log(`Chat ID: ${id}`);
    console.log(`  Type: ${type}`);
    console.log(`  Title: ${title}`);
    console.log(`  Username: ${username}`);
    console.log('');
  }

  // 3. Try to identify the group
  console.log('=== Identification ===\n');
  for (const [id, chat] of chats) {
    if (chat.type === 'supergroup') {
      console.log(`GROUP: "${chat.title}" → chat_id: ${id}`);
    } else if (chat.type === 'channel') {
      console.log(`CHANNEL: "${chat.title}" → chat_id: ${id}`);
    } else if (chat.type === 'group') {
      console.log(`LEGACY GROUP: "${chat.title}" → chat_id: ${id}`);
    }
  }

  // 4. Show topic IDs (untuk grup dengan topik/forum)
  if (topics.size > 0) {
    console.log('\n=== Topic IDs (untuk grup ber-topik) ===\n');
    for (const [, t] of topics) {
      console.log(`Chat ID: ${t.chat_id}`);
      console.log(`  Thread ID: ${t.thread_id}`);
      console.log(`  Title: ${t.title}`);
      console.log(`  message_thread_id → ${t.thread_id}`);
      console.log('');
    }
    console.log('Tambahkan ke telegram-config.json:');
    console.log('  "message_thread_id": <thread_id di atas>');
  } else {
    console.log('\n(Tidak ada topik terdeteksi. Kirim pesan di topik yang dituju dulu biar thread_id muncul.)');
  }
}

main().catch(console.error);
