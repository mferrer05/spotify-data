import { Component, computed, inject, linkedSignal } from '@angular/core';
import { StreamingData } from '../services/streaming-data';
import {
  barHeight,
  barWidth,
  formatDateRange,
  formatDuration,
  formatNumber,
  formatPercent,
  MONTH_NAMES,
  pad2,
} from '../streaming/format';
import type { TopItem } from '../streaming/streaming.model';

/** A single key performance indicator rendered in the dashboard summary strip. */
interface Kpi {
  label: string;
  value: string;
  desc: string;
}

/** One month of the per-year listening calendar grid. */
interface MonthCell {
  name: string;
  artist: TopItem | null;
  track: TopItem | null;
  hasListening: boolean;
}

@Component({
  selector: 'app-stats-dashboard',
  templateUrl: './stats-dashboard.html',
  styleUrl: './stats-dashboard.css',
})
/**
 * Displays aggregated streaming statistics derived from uploaded Spotify history:
 * KPI summary, top artists/tracks/albums, monthly listening trend, a per-year
 * breakdown, and a month-by-month calendar of top items.
 */
export class StatsDashboard {
  private readonly store = inject(StreamingData);
  protected readonly stats = this.store.stats;
  protected readonly hasData = this.store.hasData;
  protected readonly loading = this.store.loading;

  protected readonly formatDuration = formatDuration;
  protected readonly formatNumber = formatNumber;
  protected readonly formatPercent = formatPercent;
  protected readonly formatDateRange = formatDateRange;
  protected readonly barWidth = barWidth;
  protected readonly barHeight = barHeight;
  protected readonly monthNames = MONTH_NAMES;

  protected readonly kpis = computed<Kpi[]>(() => {
    const s = this.stats();
    return [
      { label: 'Listening time', value: formatDuration(s.totalMs), desc: 'total played' },
      { label: 'Plays', value: formatNumber(s.totalPlays), desc: 'stream events' },
      { label: 'Skipped', value: formatPercent(s.skipRate), desc: `${formatNumber(s.skipped)} skips` },
      { label: 'Artists', value: formatNumber(s.uniqueArtists), desc: 'unique' },
      { label: 'Tracks', value: formatNumber(s.uniqueTracks), desc: 'unique' },
      { label: 'Albums', value: formatNumber(s.uniqueAlbums), desc: 'unique' },
    ];
  });

  protected readonly maxArtistPlays = computed(() => this.stats().topArtists[0]?.plays ?? 0);
  protected readonly maxTrackPlays = computed(() => this.stats().topTracks[0]?.plays ?? 0);
  protected readonly maxAlbumPlays = computed(() => this.stats().topAlbums[0]?.plays ?? 0);
  protected readonly maxMonthMs = computed(() => {
    const points = this.stats().listeningByMonth;
    let max = 0;
    for (const point of points) {
      if (point.ms > max) {
        max = point.ms;
      }
    }
    return max;
  });

  protected readonly availableYears = computed(() => this.stats().topArtistsByYear.map((y) => y.year));
  protected readonly selectedYear = linkedSignal<string | null>(() => {
    const years = this.availableYears();
    return years.length > 0 ? years[years.length - 1] : null;
  });
  protected readonly yearTopArtists = computed(() => {
    const year = this.selectedYear();
    if (!year) {
      return [];
    }
    const entry = this.stats().topArtistsByYear.find((e) => e.year === year);
    return entry ? entry.artists : [];
  });
  protected readonly yearTopTracks = computed(() => {
    const year = this.selectedYear();
    if (!year) {
      return [];
    }
    const entry = this.stats().topTracksByYear.find((e) => e.year === year);
    return entry ? entry.tracks : [];
  });
  protected readonly monthlyCalendar = computed<MonthCell[]>(() => {
    const year = this.selectedYear();
    const byArtist = new Map(this.stats().topArtistByMonth.map((e) => [e.month, e.artist]));
    const byTrack = new Map(this.stats().topTrackByMonth.map((e) => [e.month, e.track]));
    return this.monthNames.map<MonthCell>((name, i) => {
      const key = year ? `${year}-${pad2(i + 1)}` : null;
      const artistEntry = key ? byArtist.get(key) : undefined;
      const trackEntry = key ? byTrack.get(key) : undefined;
      return {
        name,
        artist: artistEntry ?? null,
        track: trackEntry ?? null,
        hasListening: artistEntry !== undefined,
      };
    });
  });

  /** Updates the selected year breakdown from a `<select>` change event. */
  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedYear.set(select.value);
  }
}
