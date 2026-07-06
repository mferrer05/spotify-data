import { StreamingAggregator, emptyStats, normalizeRecord, parseStreamingJson } from './streaming-aggregator';
import type { StreamingRecord } from './streaming.model';

function record(overrides: Partial<StreamingRecord> = {}): StreamingRecord {
  return {
    ts: '2019-05-06T14:01:07Z',
    platform: 'Android OS 9 API 28 (OnePlus, ONEPLUS A6013)',
    ms_played: 1000,
    conn_country: 'ES',
    ip_addr: '0.0.0.0',
    master_metadata_track_name: 'Love Me Less (feat. Quinn XCII)',
    master_metadata_album_artist_name: 'MAX',
    master_metadata_album_album_name: 'Love Me Less (feat. Quinn XCII)',
    spotify_track_uri: 'spotify:track:2tOOcDDYkh0PSjr6GwPEAJ',
    episode_name: null,
    episode_show_name: null,
    spotify_episode_uri: null,
    audiobook_title: null,
    audiobook_uri: null,
    audiobook_chapter_uri: null,
    audiobook_chapter_title: null,
    reason_start: 'fwdbtn',
    reason_end: 'trackdone',
    shuffle: false,
    skipped: false,
    offline: false,
    offline_timestamp: null,
    incognito_mode: false,
    ...overrides,
  };
}

const fixtures: StreamingRecord[] = [
  record({ ts: '2019-05-06T14:01:07Z', ms_played: 1044, skipped: false }),
  record({
    ts: '2019-05-06T14:04:15Z',
    ms_played: 189486,
    master_metadata_track_name: 'Swervin (feat. 6ix9ine)',
    master_metadata_album_artist_name: 'A Boogie Wit da Hoodie',
    master_metadata_album_album_name: 'Hoodie SZN',
    spotify_track_uri: 'spotify:track:1wJRveJZLSb1rjhnUHQiv6',
  }),
  record({
    ts: '2019-05-06T14:05:17Z',
    ms_played: 60267,
    master_metadata_track_name: 'Get You The Moon (feat. Sn\u00f8w)',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_album_album_name: 'Get You The Moon (feat. Sn\u00f8w)',
    spotify_track_uri: 'spotify:track:4ZLzoOkj0MPWrTLvooIuaa',
  }),
  record({ ts: '2019-06-01T10:00:00Z', ms_played: 100000, skipped: true }),
  record({
    ts: '2019-07-01T10:00:00Z',
    ms_played: 50000,
    master_metadata_track_name: 'Get You The Moon (feat. Sn\u00f8w)',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_album_album_name: 'Get You The Moon (feat. Sn\u00f8w)',
    spotify_track_uri: 'spotify:track:4ZLzoOkj0MPWrTLvooIuaa',
  }),
];

const monthlyFixtures: StreamingRecord[] = [
  record({ ts: '2019-05-06T14:01:07Z', master_metadata_track_name: 'A', spotify_track_uri: 'spotify:track:a' }),
  record({ ts: '2019-05-07T14:01:07Z', master_metadata_track_name: 'B', spotify_track_uri: 'spotify:track:b' }),
  record({
    ts: '2019-05-08T14:01:07Z',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_track_name: 'C',
    master_metadata_album_album_name: 'K',
    spotify_track_uri: 'spotify:track:c',
  }),
  record({
    ts: '2019-06-01T10:00:00Z',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_track_name: 'D',
    master_metadata_album_album_name: 'K',
    spotify_track_uri: 'spotify:track:d',
  }),
  record({
    ts: '2019-06-02T10:00:00Z',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_track_name: 'E',
    master_metadata_album_album_name: 'K',
    spotify_track_uri: 'spotify:track:e',
  }),
  record({
    ts: '2019-06-03T10:00:00Z',
    master_metadata_album_artist_name: 'Kina',
    master_metadata_track_name: 'F',
    master_metadata_album_album_name: 'K',
    spotify_track_uri: 'spotify:track:f',
  }),
  record({
    ts: '2020-01-01T00:00:00Z',
    master_metadata_album_artist_name: 'A Boogie Wit da Hoodie',
    master_metadata_track_name: 'G',
    master_metadata_album_album_name: 'Hoodie SZN',
    spotify_track_uri: 'spotify:track:g',
  }),
];

function track(overrides: Partial<StreamingRecord>): StreamingRecord {
  return record(overrides);
}

const trackFixtures: StreamingRecord[] = [
  track({ ts: '2019-05-06T10:00:00Z', master_metadata_track_name: 'Song A', master_metadata_album_album_name: 'Album A', spotify_track_uri: 'spotify:track:song-a' }),
  track({ ts: '2019-05-07T10:00:00Z', master_metadata_track_name: 'Song A', master_metadata_album_album_name: 'Album A', spotify_track_uri: 'spotify:track:song-a' }),
  track({ ts: '2019-05-08T10:00:00Z', master_metadata_track_name: 'Song A', master_metadata_album_album_name: 'Album A', spotify_track_uri: 'spotify:track:song-a' }),
  track({ ts: '2019-05-09T10:00:00Z', master_metadata_track_name: 'Song B', master_metadata_album_album_name: 'Album B', spotify_track_uri: 'spotify:track:song-b' }),
  track({ ts: '2019-05-10T10:00:00Z', master_metadata_track_name: 'Song B', master_metadata_album_album_name: 'Album B', spotify_track_uri: 'spotify:track:song-b' }),
  track({ ts: '2019-06-01T10:00:00Z', master_metadata_album_artist_name: 'Kina', master_metadata_track_name: 'Song C', master_metadata_album_album_name: 'Album C', spotify_track_uri: 'spotify:track:song-c' }),
  track({ ts: '2019-06-02T10:00:00Z', master_metadata_album_artist_name: 'Kina', master_metadata_track_name: 'Song C', master_metadata_album_album_name: 'Album C', spotify_track_uri: 'spotify:track:song-c' }),
  track({ ts: '2019-06-03T10:00:00Z', master_metadata_album_artist_name: 'Kina', master_metadata_track_name: 'Song C', master_metadata_album_album_name: 'Album C', spotify_track_uri: 'spotify:track:song-c' }),
  track({ ts: '2019-06-04T10:00:00Z', master_metadata_album_artist_name: 'Kina', master_metadata_track_name: 'Song C', master_metadata_album_album_name: 'Album C', spotify_track_uri: 'spotify:track:song-c' }),
  track({ ts: '2019-06-05T10:00:00Z', master_metadata_album_artist_name: 'Kina', master_metadata_track_name: 'Song D', master_metadata_album_album_name: 'Album D', spotify_track_uri: 'spotify:track:song-d' }),
  track({ ts: '2020-01-01T10:00:00Z', master_metadata_album_artist_name: 'A Boogie Wit da Hoodie', master_metadata_track_name: 'Song E', master_metadata_album_album_name: 'Album E', spotify_track_uri: 'spotify:track:song-e' }),
  track({ ts: '2020-01-02T10:00:00Z', master_metadata_album_artist_name: 'A Boogie Wit da Hoodie', master_metadata_track_name: 'Song E', master_metadata_album_album_name: 'Album E', spotify_track_uri: 'spotify:track:song-e' }),
];

describe('normalizeRecord', () => {
  it('returns a normalized record for valid input', () => {
    const input = {
      ts: '2019-05-06T14:01:07Z',
      platform: 'Android',
      ms_played: 1044,
      conn_country: 'ES',
      ip_addr: '1.2.3.4',
      master_metadata_track_name: 'Love Me Less',
      master_metadata_album_artist_name: 'MAX',
      master_metadata_album_album_name: 'Love Me Less',
      spotify_track_uri: 'spotify:track:abc',
      episode_name: null,
      episode_show_name: null,
      spotify_episode_uri: null,
      audiobook_title: null,
      audiobook_uri: null,
      audiobook_chapter_uri: null,
      audiobook_chapter_title: null,
      reason_start: 'fwdbtn',
      reason_end: 'trackdone',
      shuffle: false,
      skipped: true,
      offline: false,
      offline_timestamp: null,
      incognito_mode: false,
    };
    const result = normalizeRecord(input);
    expect(result).not.toBeNull();
    expect(result?.ts).toBe('2019-05-06T14:01:07Z');
    expect(result?.ms_played).toBe(1044);
    expect(result?.skipped).toBe(true);
    expect(result?.spotify_track_uri).toBe('spotify:track:abc');
    expect(result?.offline_timestamp).toBeNull();
  });

  it('coerces non-boolean shuffle to false and keeps null nullable fields', () => {
    const result = normalizeRecord({
      ts: '2020-01-01T00:00:00Z',
      ms_played: 10,
      shuffle: 'true',
      offline_timestamp: 123,
    });
    expect(result).not.toBeNull();
    expect(result?.shuffle).toBe(false);
    expect(result?.offline_timestamp).toBe(123);
    expect(result?.master_metadata_track_name).toBeNull();
    expect(result?.platform).toBe('');
  });

  it('returns null when input is not an object', () => {
    expect(normalizeRecord(null)).toBeNull();
    expect(normalizeRecord('string')).toBeNull();
    expect(normalizeRecord(42)).toBeNull();
  });

  it('returns null when ts or ms_played is missing', () => {
    expect(normalizeRecord({ ms_played: 10 })).toBeNull();
    expect(normalizeRecord({ ts: '2020-01-01T00:00:00Z' })).toBeNull();
  });

  it('returns null when ms_played is not finite', () => {
    expect(normalizeRecord({ ts: '2020-01-01T00:00:00Z', ms_played: Number.NaN })).toBeNull();
    expect(normalizeRecord({ ts: '2020-01-01T00:00:00Z', ms_played: '10' })).toBeNull();
  });
});

describe('parseStreamingJson', () => {
  it('parses a JSON array into records', () => {
    const json = JSON.stringify([
      { ts: '2019-05-06T14:01:07Z', ms_played: 1044 },
      { ts: '2019-05-06T14:04:15Z', ms_played: 189486 },
    ]);
    const result = parseStreamingJson(json);
    expect(result).toHaveLength(2);
    expect(result[0].ms_played).toBe(1044);
  });

  it('returns an empty array for invalid JSON', () => {
    expect(parseStreamingJson('not json')).toEqual([]);
  });

  it('returns an empty array when the top-level value is not an array', () => {
    expect(parseStreamingJson(JSON.stringify({ ts: 'x', ms_played: 1 }))).toEqual([]);
  });

  it('filters out entries missing required fields', () => {
    const json = JSON.stringify([
      { ts: '2019-05-06T14:01:07Z', ms_played: 1044 },
      { ms_played: 10 },
      { ts: '2020-01-01T00:00:00Z' },
    ]);
    expect(parseStreamingJson(json)).toHaveLength(1);
  });
});

describe('StreamingAggregator', () => {
  it('emptyStats returns zeroed stats', () => {
    const stats = emptyStats();
    expect(stats.totalMs).toBe(0);
    expect(stats.totalPlays).toBe(0);
    expect(stats.uniqueArtists).toBe(0);
    expect(stats.topArtists).toEqual([]);
    expect(stats.topArtistByMonth).toEqual([]);
    expect(stats.topArtistsByYear).toEqual([]);
    expect(stats.topTrackByMonth).toEqual([]);
    expect(stats.topTracksByYear).toEqual([]);
    expect(stats.dateRange.start).toBeNull();
  });

  it('aggregates totals, uniques, and skip rate', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures);
    const stats = agg.snapshot();
    expect(stats.totalMs).toBe(400797);
    expect(stats.totalPlays).toBe(5);
    expect(stats.skipped).toBe(1);
    expect(stats.skipRate).toBeCloseTo(0.2, 5);
    expect(stats.uniqueArtists).toBe(3);
    expect(stats.uniqueTracks).toBe(3);
    expect(stats.uniqueAlbums).toBe(3);
  });

  it('tracks the played date range', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures);
    const stats = agg.snapshot();
    expect(stats.dateRange.start).toBe('2019-05-06T14:01:07Z');
    expect(stats.dateRange.end).toBe('2019-07-01T10:00:00Z');
  });

  it('ranks top artists by play count', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures);
    const stats = agg.snapshot();
    expect(stats.topArtists.map((a) => a.name)).toEqual([
      'MAX',
      'Kina',
      'A Boogie Wit da Hoodie',
    ]);
    expect(stats.topArtists[0].plays).toBe(2);
    expect(stats.topArtists[2].plays).toBe(1);
  });

  it('merges tracks sharing the same spotify uri', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures);
    const stats = agg.snapshot();
    const track = stats.topTracks.find((t) => t.name === 'Get You The Moon (feat. Sn\u00f8w)');
    expect(track?.plays).toBe(2);
    expect(track?.ms).toBe(110267);
  });

  it('groups listening time by month sorted ascending', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures);
    const stats = agg.snapshot();
    expect(stats.listeningByMonth.map((m) => m.month)).toEqual(['2019-05', '2019-06', '2019-07']);
    expect(stats.listeningByMonth[0].ms).toBe(250797);
    expect(stats.listeningByMonth[2].ms).toBe(50000);
  });

  it('computes the top artist for every month by play count', () => {
    const agg = new StreamingAggregator();
    agg.ingest(monthlyFixtures);
    const stats = agg.snapshot();
    expect(stats.topArtistByMonth.map((m) => m.month)).toEqual(['2019-05', '2019-06', '2020-01']);
    expect(stats.topArtistByMonth[0].artist?.name).toBe('MAX');
    expect(stats.topArtistByMonth[0].artist?.plays).toBe(2);
    expect(stats.topArtistByMonth[1].artist?.name).toBe('Kina');
    expect(stats.topArtistByMonth[1].artist?.plays).toBe(3);
    expect(stats.topArtistByMonth[2].artist?.name).toBe('A Boogie Wit da Hoodie');
  });

  it('computes the top 3 artists per year by play count', () => {
    const agg = new StreamingAggregator();
    agg.ingest(monthlyFixtures);
    const stats = agg.snapshot();
    expect(stats.topArtistsByYear.map((y) => y.year)).toEqual(['2019', '2020']);
    expect(stats.topArtistsByYear[0].artists.map((a) => a.name)).toEqual(['Kina', 'MAX']);
    expect(stats.topArtistsByYear[0].artists[0].plays).toBe(4);
    expect(stats.topArtistsByYear[1].artists.map((a) => a.name)).toEqual(['A Boogie Wit da Hoodie']);
  });

  it('computes the top track for every month by play count', () => {
    const agg = new StreamingAggregator();
    agg.ingest(trackFixtures);
    const stats = agg.snapshot();
    expect(stats.topTrackByMonth.map((m) => m.month)).toEqual(['2019-05', '2019-06', '2020-01']);
    expect(stats.topTrackByMonth[0].track?.name).toBe('Song A');
    expect(stats.topTrackByMonth[0].track?.plays).toBe(3);
    expect(stats.topTrackByMonth[1].track?.name).toBe('Song C');
    expect(stats.topTrackByMonth[1].track?.plays).toBe(4);
    expect(stats.topTrackByMonth[2].track?.name).toBe('Song E');
    expect(stats.topTrackByMonth[2].track?.plays).toBe(2);
  });

  it('computes the top 3 tracks per year by play count', () => {
    const agg = new StreamingAggregator();
    agg.ingest(trackFixtures);
    const stats = agg.snapshot();
    expect(stats.topTracksByYear.map((y) => y.year)).toEqual(['2019', '2020']);
    expect(stats.topTracksByYear[0].tracks.map((t) => t.name)).toEqual(['Song C', 'Song A', 'Song B']);
    expect(stats.topTracksByYear[0].tracks[0].plays).toBe(4);
    expect(stats.topTracksByYear[1].tracks.map((t) => t.name)).toEqual(['Song E']);
  });

  it('reports a null artist for months and years with only podcast plays', () => {
    const agg = new StreamingAggregator();
    agg.ingest([
      record({
        ts: '2019-05-06T14:01:07Z',
        ms_played: 1000,
        master_metadata_album_artist_name: null,
        master_metadata_track_name: null,
        master_metadata_album_album_name: null,
        spotify_track_uri: null,
      }),
    ]);
    const stats = agg.snapshot();
    expect(stats.topArtistByMonth).toHaveLength(1);
    expect(stats.topArtistByMonth[0].artist).toBeNull();
    expect(stats.topArtistsByYear).toHaveLength(1);
    expect(stats.topArtistsByYear[0].artists).toEqual([]);
    expect(stats.topTrackByMonth[0].track).toBeNull();
    expect(stats.topTracksByYear[0].tracks).toEqual([]);
  });

  it('accumulates across multiple ingest calls', () => {
    const agg = new StreamingAggregator();
    agg.ingest(fixtures.slice(0, 3));
    agg.ingest(fixtures.slice(3));
    const stats = agg.snapshot();
    expect(stats.totalPlays).toBe(5);
    expect(stats.totalMs).toBe(400797);
    expect(stats.uniqueArtists).toBe(3);
  });

  it('ignores podcast and audiobook entries without track metadata', () => {
    const agg = new StreamingAggregator();
    agg.ingest([
      record({
        ts: '2020-01-01T00:00:00Z',
        ms_played: 5000,
        master_metadata_track_name: null,
        master_metadata_album_artist_name: null,
        master_metadata_album_album_name: null,
        spotify_track_uri: null,
      }),
    ]);
    const stats = agg.snapshot();
    expect(stats.totalPlays).toBe(1);
    expect(stats.totalMs).toBe(5000);
    expect(stats.uniqueArtists).toBe(0);
    expect(stats.uniqueTracks).toBe(0);
  });
});
