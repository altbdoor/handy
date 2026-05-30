import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { GifReader } from "omggif";
import type { QueueEntry, QueueEntryFields } from "./model";

let ffmpegInstance: FFmpeg | null = null;

async function getFfmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  // 9MB gzipped, total 32MB
  const cdnUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  ffmpegInstance = new FFmpeg();

  await ffmpegInstance.load({
    coreURL: `${cdnUrl}/ffmpeg-core.js`,
    wasmURL: `${cdnUrl}/ffmpeg-core.wasm`,
  });
  return ffmpegInstance;
}

export async function decodeGifFile(
  file: File,
  canvas: OffscreenCanvas,
): Promise<QueueEntry> {
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

  const id = crypto.randomUUID();
  const filename = file.name;

  // generate preview image
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  const imageData = new ImageData(frames[0].data as any, width, height);
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({
    quality: 0.75,
    type: "image/jpeg",
  });
  const previewUrl = URL.createObjectURL(blob);

  return { id, filename, previewUrl, frames, width, height };
}

export async function encodeIntoVideo(
  assets: (QueueEntry & QueueEntryFields)[],
  resizeFactor: number,
  useFfmpeg: boolean,
  rotation: number,
): Promise<Blob> {
  const sourceW = assets[0].width;
  const sourceH = assets[0].height;

  let targetW = sourceW * resizeFactor;
  let targetH = sourceH * resizeFactor;

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
      rotation: rotation as any,
    },
    fastStart: "in-memory",
  });

  const pixels = targetW * targetH;

  // level 3.0: 414,720px, 3.1: 921,600px, 4.0: 2,097,152px
  const codecLevel = pixels <= 414_720 ? "1E" : pixels <= 921_600 ? "1F" : "28";

  const encoderConfig: VideoEncoderConfig = {
    codec: `avc1.42E0${codecLevel}`,
    width: targetW,
    height: targetH,
    bitrate: 4_000_000,
  };

  const { supported } = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!supported) {
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
          originalCanvas.width * resizeFactor,
          originalCanvas.height * resizeFactor,
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
    const { buffer } = muxer.target;

    if (!useFfmpeg) {
      const blob = new Blob([buffer], { type: "video/mp4" });
      return blob;
    }

    const ffmpeg = await getFfmpeg();
    await ffmpeg.writeFile("input.mp4", new Uint8Array(buffer));

    // visually lossless reencoding
    const exitCode = await ffmpeg.exec([
      "-fflags",
      "+genpts",
      "-i",
      "input.mp4",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      "output.mp4",
    ]);

    if (exitCode !== 0) {
      throw new Error(`ffmpeg re-encode failed (exit ${exitCode})`);
    }

    const outputBytes = (await ffmpeg.readFile("output.mp4")) as any;
    await Promise.all([
      ffmpeg.deleteFile("input.mp4"),
      ffmpeg.deleteFile("output.mp4"),
    ]);

    const ffBlob = new Blob([outputBytes], { type: "video/mp4" });
    return ffBlob;
  } finally {
    encoder.close();
  }
}
