-- Migration 0002: Ubah schema dari 1-row-per-program ke 1-row-per-channel-per-date
-- programs_json menyimpan array program sebagai JSON (hemat write: ~107 rows vs ~5000 rows)

CREATE TABLE IF NOT EXISTS channel_days (
  channel_slug TEXT NOT NULL,
  date TEXT NOT NULL,
  programs_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (channel_slug, date)
);

-- Migrate data lama (kalau ada)
INSERT OR IGNORE INTO channel_days (channel_slug, date, programs_json, updated_at)
SELECT
  channel_slug,
  date,
  json_group_array(
    json_object(
      'id', id,
      'channelSlug', channel_slug,
      'channelName', channel_name,
      'date', date,
      'start', start,
      'end', end,
      'startLabel', start_label,
      'endLabel', end_label,
      'title', title,
      'category', category,
      'description', description,
      'slug', slug,
      'manual', manual
    )
  ) AS programs_json,
  MAX(updated_at) AS updated_at
FROM programs
GROUP BY channel_slug, date;

-- Drop tabel lama
DROP TABLE IF EXISTS programs;
