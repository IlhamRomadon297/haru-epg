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
      `SELECT channel_slug, date, programs_json, updated_at
       FROM channel_days WHERE date = ?`,
    )
    .bind(date)
    .all();
  const rows = res.results;
  if (rows.length === 0) return null;

  const programs: EpgProgram[] = [];
  let updatedAt = '1970-01-01T00:00:00.000Z';
  for (const r of rows) {
    const ts = str(r.updated_at);
    if (ts > updatedAt) updatedAt = ts;
    try {
      const arr = JSON.parse(str(r.programs_json, '[]')) as Record<string, unknown>[];
      for (const p of arr) {
        programs.push({
          id: str(p.id),
          channelSlug: str(p.channelSlug),
          channelName: str(p.channelName),
          date: str(p.date),
          start: str(p.start),
          end: str(p.end),
          startLabel: str(p.startLabel),
          endLabel: str(p.endLabel),
          title: str(p.title),
          category: (p.category as string | null) ?? undefined,
          description: (p.description as string | null) ?? undefined,
          slug: str(p.slug),
          manual: Number(p.manual ?? 0) === 1,
        });
      }
    } catch { /* skip corrupt row */ }
  }
  if (programs.length === 0) return null;
  return { programs, updatedAt };
}

/** Hapus tanggal di luar jendela retensi (arsip H-4, depan H+11). */
export async function pruneD1(db: D1Db, minDate: string, maxDate: string): Promise<void> {
  await db
    .prepare(`DELETE FROM channel_days WHERE date < ? OR date > ?`)
    .bind(minDate, maxDate)
    .run()
    .catch(() => null);
}

/** Tulis ulang seluruh jadwal 1 tanggal: 1 row per channel, programs sebagai JSON. */
export async function writeDayToD1(db: D1Db, date: string, programs: EpgProgram[]): Promise<void> {
  const now = new Date().toISOString();
  const byChannel = new Map<string, EpgProgram[]>();
  for (const p of programs.filter((x) => x.date === date)) {
    const list = byChannel.get(p.channelSlug) ?? [];
    list.push(p);
    byChannel.set(p.channelSlug, list);
  }

  const stmts: { run(): Promise<unknown> }[] = [
    db.prepare(`DELETE FROM channel_days WHERE date = ?`).bind(date),
  ];
  for (const [slug, list] of byChannel) {
    const first = list[0];
    const channelName = first?.channelName ?? slug;
    const json = JSON.stringify(list.map((p) => ({
      id: p.id,
      channelSlug: p.channelSlug,
      channelName: p.channelName,
      date: p.date,
      start: p.start,
      end: p.end,
      startLabel: p.startLabel,
      endLabel: p.endLabel,
      title: p.title,
      category: p.category ?? null,
      description: p.description ?? null,
      slug: p.slug,
      manual: p.manual ? 1 : 0,
    })));
    stmts.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO channel_days
           (channel_slug, date, programs_json, updated_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(slug, date, json, now),
    );
  }
  await db.batch(stmts);
}
