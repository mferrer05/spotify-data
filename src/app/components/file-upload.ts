import { Component, inject, signal } from '@angular/core';
import { StreamingData } from '../services/streaming-data';

@Component({
  selector: 'app-file-upload',
  template: `
    <section
      class="card bg-base-200 shadow-sm border-2 border-dashed border-base-300 transition-colors mb-6"
      [class.border-primary]="dragging()"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
    >
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title">Upload Spotify history</h2>
          <p class="text-sm text-base-content/70 mt-1">
            Drop one or more <code>Streaming_History_Audio_*.json</code> files here, or pick them
            below. Everything is parsed off the main thread, so large exports stay responsive.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="btn btn-primary" [class.btn-disabled]="loading()">
            <span>Choose files</span>
            <input
              type="file"
              accept=".json,application/json"
              multiple
              class="sr-only"
              [disabled]="loading()"
              (change)="onFilesSelected($event)"
            />
          </label>
          @if (hasData()) {
            <button type="button" class="btn btn-ghost" (click)="onReset()" [disabled]="loading()">
              Clear
            </button>
          }
        </div>
        @if (loading()) {
          <div class="space-y-2">
            <progress
              class="progress progress-primary"
              [value]="progress()?.current ?? 0"
              [max]="progress()?.total ?? 1"
            ></progress>
            <p class="text-sm text-base-content/70">
              Processing {{ progress()?.current ?? 0 }} / {{ progress()?.total ?? 0 }} files&hellip;
            </p>
          </div>
        }
        @if (error() !== null) {
          <div role="alert" class="alert alert-error alert-soft">
            <span>{{ error() }}</span>
          </div>
        }
      </div>
    </section>
  `,
})
/**
 * Drag-and-drop / file-picker entry point for importing Spotify
 * `Streaming_History_Audio_*.json` exports. Delegates parsing and state
 * management to the {@link StreamingData} store.
 */
export class FileUpload {
  private readonly store = inject(StreamingData);
  protected readonly loading = this.store.loading;
  protected readonly progress = this.store.progress;
  protected readonly error = this.store.error;
  protected readonly fileNames = this.store.fileNames;
  protected readonly hasData = this.store.hasData;
  protected readonly dragging = signal(false);

  /** Handles files chosen via the hidden `<input type="file">` picker. */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files === null) {
      return;
    }
    this.store.addFiles(input.files);
    input.value = '';
  }

  /** Handles files dropped onto the upload zone, forwarding them to the store. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.store.addFiles(event.dataTransfer.files);
    }
  }

  /** Marks the drop zone as active while a drag is in progress. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  /** Clears the active drag state when the pointer leaves the drop zone. */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  /** Clears all stored streaming data and uploaded file names. */
  onReset(): void {
    this.store.reset();
  }
}
