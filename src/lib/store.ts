import { programSlug } from './providers/tivie';
import type { EpgProgram } from './types';

/** Structural typing untuk D1Database (tanpa perlu @cloudflare/workers-types). */
export interface D1BoundStmt {
  bind(...values: unknown[]): { all(): Promise<{ results: Record<string, unknown>[] }>; run(): Promise<unknown> };
}
export interface D1Db {
  prepare(query: string): D1BoundStmt;
  batch(statements: { run(): Promise<unknown> }[]): Promise<unknown[]>;
}

const str = (v: unknown, fb = ''): string => (v == null ? fb : String(v));

export async function readDayFromD1(
  db: D1Db,
  date: string,
): Promise<{ programs: EpgProgram[]; updatedAt: string } | null> {
  const res = await db
    .prepare(
      `SELECT id, channel_slug, channel_name, date, start, end, start_label, end_label,
              title, category, description, source, slug, manual, updated_at
       FROM programs WHERE date = ? ORDER BY channel_slug, start`,
    )
    .bind(date)
    .all();
  const rows = res.results;
  if (rows.length === 0) return null;
  const programs: EpgProgram[] = rows.map((r) => ({
    id: str(r.id),
    channelSlug: str(r.channel_slug),
    channelName: str(r.channel_name),
    date: str(r.date),
    start: str(r.start),
    end: str(r.end),
    startLabel: str(r.start_label),
    endLabel: str(r.end_label),
    title: str(r.title),
    category: (r.category as string | null) ?? undefined,
    description: (r.description as string | null) ?? undefined,
    slug: str(r.slug) || programSlug(str(r.channel_slug), str(r.start), str(r.title)),
    manual: Number(r.manual ?? 0) === 1,
  }));
  const updatedAt = rows.reduce(
    (max, r) => (str(r.updated_at) > max ? str(r.updated_at) : max),
    '1970-01-01T00:00:00.000Z',
  );
  return { programs, updatedAt };
}

/** Hapus tanggal di luar jendela retensi (arsip H-4, depan H+11). */
export async function pruneD1(db: D1Db, minDate: string, maxDate: string): Promise<void> {
  await db
    .prepare(`DELETE FROM programs WHERE date < ? OR date > ?`)
    .bind(minDate, maxDate)
    .run()
    .catch(() => null);
}

/** Tulis ulang seluruh jadwal 1 tanggal (DELETE + INSERT, di-chunk per 400 baris). */
export async function writeDayToD1(db: D1Db, date: string, programs: EpgProgram[]): Promise<void> {
  const now = new Date().toISOString();
  const stmts: { run(): Promise<unknown> }[] = [
    db.prepare(`DELETE FROM programs WHERE date = ?`).bind(date),
  ];
  for (const p of programs.filter((x) => x.date === date)) {
    stmts.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO programs
           (id, channel_slug, channel_name, date, start, end, start_label, end_label,
            title, category, description, source, slug, manual, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          p.id,
          p.channelSlug,
          p.channelName,
          p.date,
          p.start,
          p.end,
          p.startLabel,
          p.endLabel,
          p.title,
          p.category ?? null,
          p.description ?? null,
          p.manual ? 'sheet' : 'scrape',
          p.slug,
          p.manual ? 1 : 0,
          now,
        ),
    );
  }
  for (let i = 0; i < stmts.length; i += 400) {
    await db.batch(stmts.slice(i, i + 400));
  }
}
