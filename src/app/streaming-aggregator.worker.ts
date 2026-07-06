/// <reference lib="webworker" />

import { StreamingAggregator, emptyStats, parseStreamingJson } from './streaming/streaming-aggregator';
import type { WorkerRequest, WorkerResponse } from './streaming/streaming.model';

/** Lazily-initialized aggregator; `null` after a reset. */
let aggregator: StreamingAggregator | null = null;

/** Posts a typed message back to the main thread. */
function post(message: WorkerResponse): void {
  postMessage(message);
}

/** Reads, parses, and ingests each file, emitting progress and final stats. */
async function handleAdd(files: File[]): Promise<void> {
  const agg = aggregator ?? new StreamingAggregator();
  aggregator = agg;
  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (file === undefined) {
      continue;
    }
    try {
      const text = await file.text();
      agg.ingest(parseStreamingJson(text));
    } catch (err) {
      post({
        type: 'error',
        fileName: file.name,
        message: err instanceof Error ? err.message : 'parse error',
      });
    }
    post({ type: 'progress', fileName: file.name, index: i, total });
  }
  post({ type: 'stats', stats: agg.snapshot() });
}

/** Main worker entry point: dispatches add/reset requests from the main thread. */
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === 'reset') {
    aggregator = null;
    post({ type: 'stats', stats: emptyStats() });
    return;
  }
  if (request.type === 'add') {
    handleAdd(request.files).catch((err: unknown) =>
      post({
        type: 'error',
        fileName: '',
        message: err instanceof Error ? err.message : 'unexpected error',
      }),
    );
  }
});
