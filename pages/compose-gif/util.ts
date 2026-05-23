import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { GifReader } from "omggif";

export interface GifAsset {
  id: string;
  queueId: string;
  filename: string;
  frames: GifFrame[];
  width: number;
  height: number;
  durationInS: number;
}

interface GifFrame {
  delayInMs: number;
  data: Uint8ClampedArray;
}

export async function decodeGifFile(file: File): Promise<GifAsset> {
  const buffer = await file.arrayBuffer();
  const reader = new GifReader(new Uint8Array(buffer));

  const width = reader.width;
  const height = reader.height;
  const rgba = new Uint8ClampedArray(width * height * 4);

  const frames = Array(reader.numFrames())
    .fill(0)
    .map((_, idx) => {
      const frameInfo = reader.frameInfo(idx);
      reader.decodeAndBlitFrameRGBA(idx, rgba);

      return {
        delayInMs: frameInfo.delay * 10,
        data: new Uint8ClampedArray(rgba),
      };
    });

  const data: GifAsset = {
    id: crypto.randomUUID(),
    queueId: "",
    filename: file.name,
    frames,
    width,
    height,
    durationInS: 1,
  };

  return data;
}

export async function encodeMp4FromGifAssets(
  assets: GifAsset[],
): Promise<Blob> {
  const sourceW = assets[0].width;
  const sourceH = assets[0].height;

  // trim dimension because video encoder needs divisible by 2
  const targetW = sourceW % 2 === 0 ? sourceW : sourceW - 1;
  const targetH = sourceH % 2 === 0 ? sourceH : sourceH - 1;

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: canvas.width,
      height: canvas.height,
    },
    fastStart: "in-memory",
  });

  // baseline encoder config
  const encoderConfig: VideoEncoderConfig = {
    codec: "avc1.42E01E",
    width: canvas.width,
    height: canvas.height,
    bitrate: 12_000_000,
    avc: { format: "annexb" },
  };

  const { supported } = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!supported) {
    // todo: handle this and inform user
    throw new Error("VideoEncoder config not supported");
  }

  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      encoderError = new Error(`VideoEncoder error: ${String(err)}`);
    },
  });

  try {
    encoder.configure(encoderConfig);

    let totalRenderTimeInMs = 0;
    assets.forEach((currentAsset) => {
      const targetDurationInMs = currentAsset.durationInS * 1000;
      if (currentAsset.frames.length === 0 || targetDurationInMs <= 0) {
        return;
      }

      let totalAssetTimeInMs = 0;
      let loopFrameIdx = 0;

      // continuous loop until we match the duration needed
      while (totalAssetTimeInMs < targetDurationInMs) {
        const loopFrame = currentAsset.frames[loopFrameIdx];

        // compute remaining duration
        const remainingDurationInMs = targetDurationInMs - totalAssetTimeInMs;
        const frameDurationInMs = Math.min(
          loopFrame.delayInMs,
          remainingDurationInMs,
        );

        // draw frame into canvas
        const imageData = new ImageData(
          loopFrame.data as any,
          currentAsset.width,
          currentAsset.height,
        );
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);

        // render canvas into video frame
        const vf = new VideoFrame(canvas, {
          timestamp: totalRenderTimeInMs * 1000,
          duration: frameDurationInMs * 1000,
        });

        // encode
        encoder.encode(vf, { keyFrame: loopFrameIdx === 0 });
        vf.close();

        if (encoderError) {
          throw encoderError;
        }

        // update time and index
        totalRenderTimeInMs += frameDurationInMs;
        totalAssetTimeInMs += frameDurationInMs;
        loopFrameIdx = (loopFrameIdx + 1) % currentAsset.frames.length;
      }
    });

    // finalize all video
    await encoder.flush();
    if (encoderError) {
      throw encoderError;
    }

    muxer.finalize();

    // obtain blob
    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: "video/mp4" });
    return blob;
  } finally {
    encoder.close();
  }
}

export async function getPreviewBlobsFromGifAssets(assets: GifAsset[]) {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext("2d")!;

  const blobList: Blob[] = [];

  for (const asset of assets) {
    canvas.width = asset.width;
    canvas.height = asset.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageData = new ImageData(
      asset.frames[0].data as any,
      asset.width,
      asset.height,
    );
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob({
      quality: 0.75,
      type: "image/jpeg",
    });
    blobList.push(blob);
  }

  return blobList;
}
