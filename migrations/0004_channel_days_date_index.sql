-- Migration 0004: index untuk query baca harian (WHERE date = ?).
-- Sebelumnya channel_days hanya punya PRIMARY KEY (channel_slug, date),
-- sehingga readDayFromD1() full-scan ~1600 rows setiap ada pageview/API hit
-- (terukur ~4M rows read/hari). Dengan index ini jadi ~105 rows per baca.
CREATE INDEX IF NOT EXISTS idx_channel_days_date ON channel_days(date);
