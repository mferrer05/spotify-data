/** A single normalized Spotify streaming-history event. */
export interface StreamingRecord {
  ts: string;
  platform: string;
  ms_played: number;
  conn_country: string;
  ip_addr: string;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  spotify_track_uri: string | null;
  episode_name: string | null;
  episode_show_name: string | null;
  spotify_episode_uri: string | null;
  audiobook_title: string | null;
  audiobook_uri: string | null;
  audiobook_chapter_uri: string | null;
  audiobook_chapter_title: string | null;
  reason_start: string;
  reason_end: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  offline_timestamp: number | null;
  incognito_mode: boolean;
}

/** A ranked item (artist/track/album) with play count and total ms played. */
export interface TopItem {
  name: string;
  subtitle: string | null;
  ms: number;
  plays: number;
}

/** A monthly listening-time data point. */
export interface TimePoint {
  month: string;
  ms: number;
}

/** Inclusive start/end timestamps of the ingested history. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

/** The top artist for a single month. */
export interface MonthTopArtist {
  month: string;
  artist: TopItem | null;
}

/** The top artists for a single year. */
export interface YearTopArtists {
  year: string;
  artists: TopItem[];
}

/** The top track for a single month. */
export interface MonthTopTrack {
  month: string;
  track: TopItem | null;
}

/** The top tracks for a single year. */
export interface YearTopTracks {
  year: string;
  tracks: TopItem[];
}

/** Complete aggregated statistics produced by {@link StreamingAggregator.snapshot}. */
export interface StreamingStats {
  totalMs: number;
  totalPlays: number;
  skipped: number;
  skipRate: number;
  uniqueArtists: number;
  uniqueTracks: number;
  uniqueAlbums: number;
  topArtists: TopItem[];
  topTracks: TopItem[];
  topAlbums: TopItem[];
  listeningByMonth: TimePoint[];
  topArtistByMonth: MonthTopArtist[];
  topArtistsByYear: YearTopArtists[];
  topTrackByMonth: MonthTopTrack[];
  topTracksByYear: YearTopTracks[];
  dateRange: DateRange;
}

/** Messages sent from the main thread to the aggregator worker. */
export type WorkerRequest =
  | { type: 'add'; files: File[] }
  | { type: 'reset' };

/** Messages sent from the aggregator worker back to the main thread. */
export type WorkerResponse =
  | { type: 'progress'; fileName: string; index: number; total: number }
  | { type: 'stats'; stats: StreamingStats }
  | { type: 'error'; fileName: string; message: string };
