export interface GifAsset {
  id: string;
  filename: string;
  frames: GifFrame[];
  width: number;
  height: number;
}

export interface QueueEntry {
  queueId: string;
  poolId: string;
  filename: string;
}

export interface QueueFormFields {
  durationInS: number;
}

export interface GifFrame {
  delayInMs: number;
  data: Uint8ClampedArray;
}
