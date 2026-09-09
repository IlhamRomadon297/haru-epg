import type { EpgProgram } from './types';

/** Structural typing untuk D1Database (tanpa perlu @cloudflare/workers-types). */
export interface D1BoundStmt {
  bind(...values: unknown[]): {
    all(): Promise<{ results: Record<string, unknown>[] }>;
    run(): Promise<unknown>;
    first?<T = Record<string, unknown>>(col?: string): Promise<T | null>;
  };
  first?<T = Record<string, unknown>>(col?: string): Promise<T | null>;
}
export interface D1Db {
  prepare(query: string): D1BoundStmt;
  batch(statements: { run(): Promise<unknown> }[]): Promise<unknown[]>;
}

const str = (v: unknown, fb = ''): string => (v == null ? fb : String(v));

function parseProgramsJson(json: string): EpgProgram[] {
  const programs: EpgProgram[] = [];
  try {
    const arr = JSON.parse(json) as Record<string, unknown>[];
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
  } catch {
    /* skip corrupt json */
  }
  return programs;
}

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
    programs.push(...parseProgramsJson(str(r.programs_json, '[]')));
  }
  if (programs.length === 0) return null;
  return { programs, updatedAt };
}

/** Baca jadwal SATU channel (1 row D1) — ringan, dipakai jalur /api/channel/[slug]. */
export async function readChannelFromD1(
  db: D1Db,
  slug: string,
  date: string,
): Promise<{ programs: EpgProgram[]; updatedAt: string } | null> {
  const res = await db
    .prepare(
      `SELECT channel_slug, date, programs_json, updated_at
       FROM channel_days WHERE channel_slug = ? AND date = ?`,
    )
    .bind(slug, date)
    .all();
  const row = res.results[0];
  if (!row) return null;
  const programs = parseProgramsJson(str(row.programs_json, '[]'));
  if (programs.length === 0) return null;
  return { programs, updatedAt: str(row.updated_at, '1970-01-01T00:00:00.000Z') };
}

/** Cadangan bila baca seluruh-hari gagal: baca per channel dalam chunk batch 50. */
export async function readDayFromD1Fallback(
  db: D1Db,
  date: string,
): Promise<{ programs: EpgProgram[]; updatedAt: string } | null> {
  const slugsRes = await db
    .prepare(`SELECT DISTINCT channel_slug FROM channel_days WHERE date = ?`)
    .bind(date)
    .all();
  const slugs = slugsRes.results as Record<string, unknown>[];
  if (slugs.length === 0) return null;

  const reads = slugs.map((s) =>
    db
      .prepare(
        `SELECT channel_slug, date, programs_json, updated_at
         FROM channel_days WHERE channel_slug = ? AND date = ?`,
      )
      .bind(str(s.channel_slug), date),
  );

  const programs: EpgProgram[] = [];
  let updatedAt = '1970-01-01T00:00:00.000Z';
  for (let i = 0; i < reads.length; i += 50) {
    try {
      const results = (await db.batch(reads.slice(i, i + 50))) as unknown as {
        results: Record<string, unknown>[];
      }[];
      for (const r of results) {
        const row = r.results[0];
        const ts = str(row?.updated_at);
        if (ts > updatedAt) updatedAt = ts;
        if (row) programs.push(...parseProgramsJson(str(row.programs_json, '[]')));
      }
    } catch {
      /* lanjut chunk berikut */
    }
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

/** Tulis ulang jadwal 1 tanggal: 1 row per channel, programs sebagai JSON. */
export async function writeDayToD1(db: D1Db, date: string, programs: EpgProgram[]): Promise<void> {
  const now = new Date().toISOString();
  const byChannel = new Map<string, EpgProgram[]>();
  for (const p of programs.filter((x) => x.date === date)) {
    const list = byChannel.get(p.channelSlug) ?? [];
    list.push(p);
    byChannel.set(p.channelSlug, list);
  }

  const stmts: { run(): Promise<unknown> }[] = [];
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
  if (stmts.length > 0) await db.batch(stmts);
}
