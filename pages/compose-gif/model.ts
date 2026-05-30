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

interface GifFrame {
  delayInMs: number;
  data: Uint8ClampedArray;
}
