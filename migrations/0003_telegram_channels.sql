-- Migration 0003: Tabel konfigurasi bot telegram
CREATE TABLE IF NOT EXISTS telegram_channels (
  chat_id INTEGER NOT NULL,
  message_thread_id INTEGER NOT NULL,
  channels TEXT NOT NULL,
  admins TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (chat_id, message_thread_id)
);
