import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { GifReader } from "omggif";
import type { GifAsset, QueueFormFields } from "./model";

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
    filename: file.name,
    frames,
    width,
    height,
  };

  return data;
}

const RESIZE_FACTOR = 2;

export async function encodeMp4FromGifAssets(
  assets: (GifAsset & QueueFormFields)[],
): Promise<Blob> {
  const sourceW = assets[0].width;
  const sourceH = assets[0].height;

  let targetW = sourceW * RESIZE_FACTOR;
  let targetH = sourceH * RESIZE_FACTOR;

  // trim dimension because video encoder needs divisible by 2
  targetW = targetW % 2 === 0 ? targetW : targetW - 1;
  targetH = targetH % 2 === 0 ? targetH : targetH - 1;

  const multipliedCanvas = new OffscreenCanvas(targetW, targetH);
  const multipliedCtx = multipliedCanvas.getContext("2d")!;
  multipliedCtx.imageSmoothingEnabled = false;

  const originalCanvas = new OffscreenCanvas(sourceW, sourceH);
  const originalCtx = originalCanvas.getContext("2d")!;
  originalCtx.imageSmoothingEnabled = false;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: multipliedCanvas.width,
      height: multipliedCanvas.height,
    },
    fastStart: "in-memory",
  });

  // baseline encoder config
  const encoderConfig: VideoEncoderConfig = {
    codec: "avc1.42E01E",
    width: multipliedCanvas.width,
    height: multipliedCanvas.height,
    bitrate: 4_000_000,
    // avc: { format: "annexb" },
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
      // may overrun — that's intentional, avoids truncated frames
      while (totalAssetTimeInMs < targetDurationInMs) {
        const loopFrame = currentAsset.frames[loopFrameIdx];

        // draw frame into canvas
        const imageData = new ImageData(
          loopFrame.data as any,
          currentAsset.width,
          currentAsset.height,
        );

        originalCtx.clearRect(
          0,
          0,
          originalCanvas.width,
          originalCanvas.height,
        );
        originalCtx.putImageData(imageData, 0, 0);

        multipliedCtx.clearRect(
          0,
          0,
          multipliedCanvas.width,
          multipliedCanvas.height,
        );
        multipliedCtx.drawImage(
          originalCanvas,
          0,
          0,
          originalCanvas.width * RESIZE_FACTOR,
          originalCanvas.height * RESIZE_FACTOR,
        );

        // render canvas into video frame
        const vf = new VideoFrame(multipliedCanvas, {
          timestamp: totalRenderTimeInMs * 1000,
          duration: loopFrame.delayInMs * 1000,
        });

        // encode
        encoder.encode(vf, { keyFrame: loopFrameIdx === 0 });
        vf.close();

        if (encoderError) {
          throw encoderError;
        }

        // update time and index
        totalRenderTimeInMs += loopFrame.delayInMs;
        totalAssetTimeInMs += loopFrame.delayInMs;
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

export async function getPreviewBlobsFromGifAssets(
  canvas: OffscreenCanvas,
  asset: GifAsset,
) {
  const ctx = canvas.getContext("2d")!;

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

  return blob;
}
