-- Migration 0005: progres posting jadwal harian bot (agar bisa di-batch antar tick cron).
CREATE TABLE IF NOT EXISTS bot_post (
  date TEXT PRIMARY KEY,
  next_index INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
