CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  channel_slug TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  start_label TEXT NOT NULL,
  end_label TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'scrape',
  slug TEXT NOT NULL,
  manual INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_programs_date ON programs(date, channel_slug, start);
