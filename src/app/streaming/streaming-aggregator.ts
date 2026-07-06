import type {
  MonthTopArtist,
  MonthTopTrack,
  StreamingRecord,
  StreamingStats,
  TopItem,
  YearTopArtists,
  YearTopTracks,
} from './streaming.model';

/** Internal running aggregate for a single artist. */
interface ArtistAgg {
  name: string;
  ms: number;
  plays: number;
}

/** Internal running aggregate for a single track. */
interface TrackAgg {
  name: string;
  artist: string | null;
  album: string | null;
  ms: number;
  plays: number;
}

/** Internal running aggregate for a single album. */
interface AlbumAgg {
  name: string;
  artist: string | null;
  ms: number;
  plays: number;
}

/** Number of top items to keep for the all-time rankings. */
const TOP_LIMIT = 10;

/** Number of top items to keep per year breakdown. */
const YEAR_TOP_LIMIT = 3;

/** Returns an empty {@link StreamingStats} object with zeroed counters and empty lists. */
export function emptyStats(): StreamingStats {
  return {
    totalMs: 0,
    totalPlays: 0,
    skipped: 0,
    skipRate: 0,
    uniqueArtists: 0,
    uniqueTracks: 0,
    uniqueAlbums: 0,
    topArtists: [],
    topTracks: [],
    topAlbums: [],
    listeningByMonth: [],
    topArtistByMonth: [],
    topArtistsByYear: [],
    topTrackByMonth: [],
    topTracksByYear: [],
    dateRange: { start: null, end: null },
  };
}

/** Narrows an unknown value to a string, or `null` when not a string. */
function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Narrows an unknown value to a boolean, defaulting to `false`. */
function asBool(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

/** Narrows an unknown value to a finite number, or `null`. */
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Validates and coerces a raw parsed JSON object into a {@link StreamingRecord},
 * or returns `null` when required fields (`ts`, `ms_played`) are missing/invalid.
 */
export function normalizeRecord(input: unknown): StreamingRecord | null {
  if (input === null || typeof input !== 'object') {
    return null;
  }
  const r = input as Record<string, unknown>;
  const ts = asString(r['ts']);
  const msPlayed = asNumber(r['ms_played']);
  if (ts === null || msPlayed === null) {
    return null;
  }
  return {
    ts,
    platform: asString(r['platform']) ?? '',
    ms_played: msPlayed,
    conn_country: asString(r['conn_country']) ?? '',
    ip_addr: asString(r['ip_addr']) ?? '',
    master_metadata_track_name: asString(r['master_metadata_track_name']),
    master_metadata_album_artist_name: asString(r['master_metadata_album_artist_name']),
    master_metadata_album_album_name: asString(r['master_metadata_album_album_name']),
    spotify_track_uri: asString(r['spotify_track_uri']),
    episode_name: asString(r['episode_name']),
    episode_show_name: asString(r['episode_show_name']),
    spotify_episode_uri: asString(r['spotify_episode_uri']),
    audiobook_title: asString(r['audiobook_title']),
    audiobook_uri: asString(r['audiobook_uri']),
    audiobook_chapter_uri: asString(r['audiobook_chapter_uri']),
    audiobook_chapter_title: asString(r['audiobook_chapter_title']),
    reason_start: asString(r['reason_start']) ?? '',
    reason_end: asString(r['reason_end']) ?? '',
    shuffle: asBool(r['shuffle']),
    skipped: asBool(r['skipped']),
    offline: asBool(r['offline']),
    offline_timestamp: asNumber(r['offline_timestamp']),
    incognito_mode: asBool(r['incognito_mode']),
  };
}

/** Parses a Spotify streaming-history JSON string into validated {@link StreamingRecord}s. */
export function parseStreamingJson(text: string): StreamingRecord[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const out: StreamingRecord[] = [];
  for (const item of data) {
    const record = normalizeRecord(item);
    if (record !== null) {
      out.push(record);
    }
  }
  return out;
}

/** Returns a new array sorted by descending play count (highest first). */
function sortByPlaysDesc<T extends { plays: number }>(items: readonly T[]): T[] {
  return items.slice().sort((a, b) => b.plays - a.plays);
}

/** Ascending string comparator used for chronological month/year ordering. */
function compareAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Incrementally aggregates {@link StreamingRecord}s into top-lists and totals
 * for artists, tracks, albums, months, and years. Call {@link ingest} to feed
 * records, then {@link snapshot} to produce a frozen {@link StreamingStats}.
 */
export class StreamingAggregator {
  private readonly artists = new Map<string, ArtistAgg>();
  private readonly tracks = new Map<string, TrackAgg>();
  private readonly albums = new Map<string, AlbumAgg>();
  private readonly months = new Map<string, number>();
  private readonly monthArtists = new Map<string, Map<string, ArtistAgg>>();
  private readonly yearArtists = new Map<string, Map<string, ArtistAgg>>();
  private readonly monthTracks = new Map<string, Map<string, TrackAgg>>();
  private readonly yearTracks = new Map<string, Map<string, TrackAgg>>();
  private totalMs = 0;
  private totalPlays = 0;
  private skipped = 0;
  private minTs: string | null = null;
  private maxTs: string | null = null;

  /** Accumulates a batch of streaming records into all internal aggregates. */
  ingest(records: readonly StreamingRecord[]): void {
    for (const r of records) {
      this.totalMs += r.ms_played;
      this.totalPlays += 1;
      if (r.skipped) {
        this.skipped += 1;
      }
      if (this.minTs === null || r.ts < this.minTs) {
        this.minTs = r.ts;
      }
      if (this.maxTs === null || r.ts > this.maxTs) {
        this.maxTs = r.ts;
      }
      const month = r.ts.slice(0, 7);
      const year = r.ts.slice(0, 4);
      this.months.set(month, (this.months.get(month) ?? 0) + r.ms_played);
      this.ingestArtist(r, month, year);
      this.ingestTrack(r, month, year);
      this.ingestAlbum(r);
    }
  }

  /** Builds an immutable summary of everything ingested so far. */
  snapshot(): StreamingStats {
    const topArtists = sortByPlaysDesc(Array.from(this.artists.values()))
      .slice(0, TOP_LIMIT)
      .map<TopItem>((a) => toTopItem(a.name, null, a));
    const topTracks = sortByPlaysDesc(Array.from(this.tracks.values()))
      .slice(0, TOP_LIMIT)
      .map<TopItem>((t) => toTopItem(t.name, t.artist, t));
    const topAlbums = sortByPlaysDesc(Array.from(this.albums.values()))
      .slice(0, TOP_LIMIT)
      .map<TopItem>((a) => toTopItem(a.name, a.artist, a));
    const listeningByMonth = Array.from(this.months.entries())
      .map<{ month: string; ms: number }>(([month, ms]) => ({ month, ms }))
      .sort((a, b) => compareAsc(a.month, b.month));
    const topArtistByMonth = this.buildTopArtistByMonth();
    const topArtistsByYear = this.buildTopArtistsByYear();
    const topTrackByMonth = this.buildTopTrackByMonth();
    const topTracksByYear = this.buildTopTracksByYear();
    return {
      totalMs: this.totalMs,
      totalPlays: this.totalPlays,
      skipped: this.skipped,
      skipRate: this.totalPlays > 0 ? this.skipped / this.totalPlays : 0,
      uniqueArtists: this.artists.size,
      uniqueTracks: this.tracks.size,
      uniqueAlbums: this.albums.size,
      topArtists,
      topTracks,
      topAlbums,
      listeningByMonth,
      topArtistByMonth,
      topArtistsByYear,
      topTrackByMonth,
      topTracksByYear,
      dateRange: { start: this.minTs, end: this.maxTs },
    };
  }

  /** Builds the per-month top artist list, ordered chronologically. */
  private buildTopArtistByMonth(): MonthTopArtist[] {
    return Array.from(this.months.keys())
      .sort(compareAsc)
      .map<MonthTopArtist>((month) => {
        const artistMap = this.monthArtists.get(month);
        if (artistMap === undefined) {
          return { month, artist: null };
        }
        const best = topByPlays(artistMap);
        return {
          month,
          artist: best === null ? null : toTopItem(best.name, null, best),
        };
      });
  }

  /** Builds the yearly top artists list (up to {@link YEAR_TOP_LIMIT} each). */
  private buildTopArtistsByYear(): YearTopArtists[] {
    const years = Array.from(new Set(Array.from(this.months.keys()).map((m) => m.slice(0, 4))));
    return years.sort(compareAsc).map<YearTopArtists>((year) => {
      const artistMap = this.yearArtists.get(year);
      const artists =
        artistMap === undefined
          ? []
          : sortByPlaysDesc(Array.from(artistMap.values()))
              .slice(0, YEAR_TOP_LIMIT)
              .map<TopItem>((a) => toTopItem(a.name, null, a));
      return { year, artists };
    });
  }

  /** Builds the per-month top track list, ordered chronologically. */
  private buildTopTrackByMonth(): MonthTopTrack[] {
    return Array.from(this.months.keys())
      .sort(compareAsc)
      .map<MonthTopTrack>((month) => {
        const trackMap = this.monthTracks.get(month);
        if (trackMap === undefined) {
          return { month, track: null };
        }
        const best = topByPlays(trackMap);
        return {
          month,
          track: best === null ? null : toTopItem(best.name, best.artist, best),
        };
      });
  }

  /** Builds the yearly top tracks list (up to {@link YEAR_TOP_LIMIT} each). */
  private buildTopTracksByYear(): YearTopTracks[] {
    const years = Array.from(new Set(Array.from(this.months.keys()).map((m) => m.slice(0, 4))));
    return years.sort(compareAsc).map<YearTopTracks>((year) => {
      const trackMap = this.yearTracks.get(year);
      const tracks =
        trackMap === undefined
          ? []
          : sortByPlaysDesc(Array.from(trackMap.values()))
              .slice(0, YEAR_TOP_LIMIT)
              .map<TopItem>((t) => toTopItem(t.name, t.artist, t));
      return { year, tracks };
    });
  }

  /** Updates all-time, monthly, and yearly artist aggregates for a record. */
  private ingestArtist(r: StreamingRecord, month: string, year: string): void {
    const name = r.master_metadata_album_artist_name;
    if (name === null || name === '') {
      return;
    }
    this.bumpArtist(this.artists, name, r.ms_played);
    this.bumpArtist(this.monthArtistMap(month), name, r.ms_played);
    this.bumpArtist(this.yearArtistMap(year), name, r.ms_played);
  }

  /** Increments (or creates) an artist aggregate entry by play count and ms. */
  private bumpArtist(map: Map<string, ArtistAgg>, name: string, ms: number): void {
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.ms += ms;
      existing.plays += 1;
    } else {
      map.set(key, { name, ms, plays: 1 });
    }
  }

  /** Returns (creating if needed) the per-month artist aggregate map. */
  private monthArtistMap(month: string): Map<string, ArtistAgg> {
    let map = this.monthArtists.get(month);
    if (map === undefined) {
      map = new Map();
      this.monthArtists.set(month, map);
    }
    return map;
  }

  /** Returns (creating if needed) the per-year artist aggregate map. */
  private yearArtistMap(year: string): Map<string, ArtistAgg> {
    let map = this.yearArtists.get(year);
    if (map === undefined) {
      map = new Map();
      this.yearArtists.set(year, map);
    }
    return map;
  }

  /** Updates all-time, monthly, and yearly track aggregates for a record. */
  private ingestTrack(r: StreamingRecord, month: string, year: string): void {
    const name = r.master_metadata_track_name;
    if (name === null || name === '') {
      return;
    }
    const key = r.spotify_track_uri ?? `${name}|${r.master_metadata_album_artist_name ?? ''}`;
    this.bumpTrack(this.tracks, key, name, r);
    this.bumpTrack(this.monthTrackMap(month), key, name, r);
    this.bumpTrack(this.yearTrackMap(year), key, name, r);
  }

/** Increments (or creates) a track aggregate entry by play count and ms. */
  private bumpTrack(
    map: Map<string, TrackAgg>,
    key: string,
    name: string,
    r: StreamingRecord,
  ): void {
    const existing = map.get(key);
    if (existing) {
      existing.ms += r.ms_played;
      existing.plays += 1;
    } else {
      map.set(key, {
        name,
        artist: r.master_metadata_album_artist_name,
        album: r.master_metadata_album_album_name,
        ms: r.ms_played,
        plays: 1,
      });
    }
  }

  /** Returns (creating if needed) the per-month track aggregate map. */
  private monthTrackMap(month: string): Map<string, TrackAgg> {
    let map = this.monthTracks.get(month);
    if (map === undefined) {
      map = new Map();
      this.monthTracks.set(month, map);
    }
    return map;
  }

  /** Returns (creating if needed) the per-year track aggregate map. */
  private yearTrackMap(year: string): Map<string, TrackAgg> {
    let map = this.yearTracks.get(year);
    if (map === undefined) {
      map = new Map();
      this.yearTracks.set(year, map);
    }
    return map;
  }

  /** Updates the all-time album aggregate for a record. */
  private ingestAlbum(r: StreamingRecord): void {
    const name = r.master_metadata_album_album_name;
    if (name === null || name === '') {
      return;
    }
    const key = `${name.toLowerCase()}|${(r.master_metadata_album_artist_name ?? '').toLowerCase()}`;
    const existing = this.albums.get(key);
    if (existing) {
      existing.ms += r.ms_played;
      existing.plays += 1;
    } else {
      this.albums.set(key, {
        name,
        artist: r.master_metadata_album_artist_name,
        ms: r.ms_played,
        plays: 1,
      });
    }
  }
}

/** Converts an aggregate into a public {@link TopItem} with optional subtitle. */
function toTopItem(name: string, subtitle: string | null, agg: { ms: number; plays: number }): TopItem {
  return { name, subtitle, ms: agg.ms, plays: agg.plays };
}

/** Returns the entry with the highest play count in a map, or `null` when empty. */
function topByPlays<T extends { plays: number }>(map: Map<string, T>): T | null {
  let best: T | null = null;
  for (const agg of map.values()) {
    if (best === null || agg.plays > best.plays) {
      best = agg;
    }
  }
  return best;
}
