export interface QueueEntry {
  id: string;
  filename: string;
  previewUrl: string;
  frames: GifFrame[];
  width: number;
  height: number;
}

export interface QueueEntryFields {
  durationInS: number;
}

export interface ComposeOptions {
  durations: number[];
  renderSize: number;
  rotation: number;
  useFfmpeg: boolean;
}

interface GifFrame {
  delayInMs: number;
  data: Uint8ClampedArray;
}
