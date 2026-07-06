import { computed, Service, signal } from '@angular/core';
import { emptyStats } from '../streaming/streaming-aggregator';
import type { StreamingStats, WorkerResponse } from '../streaming/streaming.model';

/** Tracks per-file parsing progress surfaced to the UI. */
interface Progress {
  current: number;
  total: number;
}

/**
 * Application-wide store for Spotify streaming history. Owns a Web Worker that
 * parses uploaded `Streaming_History_Audio_*.json` files off the main thread
 * and exposes reactive signals for stats, loading state, progress, and errors.
 */
@Service()
export class StreamingData {
  private readonly _stats = signal<StreamingStats | null>(null);
  private readonly _loading = signal(false);
  private readonly _progress = signal<Progress | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _fileNames = signal<string[]>([]);
  private worker: Worker | null = null;

  readonly stats = computed<StreamingStats>(() => this._stats() ?? emptyStats());
  readonly hasData = computed(() => this._stats() !== null);
  readonly loading = this._loading.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly error = this._error.asReadonly();
  readonly fileNames = this._fileNames.asReadonly();

  /** Queues the given files for parsing in the background worker and updates UI state. */
  addFiles(files: FileList | File[]): void {
    const list = Array.from(files);
    if (list.length === 0) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this._fileNames.update((names) => [...names, ...list.map((file) => file.name)]);
    this._progress.set({ current: 0, total: list.length });
    this.getWorker().postMessage({ type: 'add', files: list });
  }

  /** Clears all ingested data and resets the store to its initial empty state. */
  reset(): void {
    this.getWorker().postMessage({ type: 'reset' });
    this._stats.set(null);
    this._loading.set(false);
    this._progress.set(null);
    this._error.set(null);
    this._fileNames.set([]);
  }

  /** Lazily creates, wires, and caches the aggregator Web Worker instance. */
  private getWorker(): Worker {
    if (this.worker === null) {
      const worker = new Worker(new URL('../streaming-aggregator.worker', import.meta.url));
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handle(event.data);
      worker.onerror = () => this._error.set('The processing worker crashed unexpectedly.');
      this.worker = worker;
    }
    return this.worker;
  }

  /** Dispatches incoming worker messages to the corresponding signal updates. */
  private handle(message: WorkerResponse): void {
    if (message.type === 'progress') {
      this._progress.set({ current: message.index + 1, total: message.total });
    } else if (message.type === 'stats') {
      this._stats.set(message.stats);
      this._loading.set(false);
      this._progress.set(null);
    } else if (message.type === 'error') {
      const name = message.fileName === '' ? 'a file' : message.fileName;
      this._error.set(`Failed to process ${name}: ${message.message}`);
    }
  }
}
