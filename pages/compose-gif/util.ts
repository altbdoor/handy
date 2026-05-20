import { GifReader } from "omggif";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

interface FileContainer {
  filename: string;
  frames: FileContainerFrame[];
  width: number;
  height: number;
}

interface FileContainerFrame {
  delayInMs: number;
  data: Uint8ClampedArray;
}

export async function getFrameDataFromFile(file: File): Promise<FileContainer> {
  const buffer = await file.arrayBuffer();
  const reader = new GifReader(new Uint8Array(buffer));

  const width = reader.width;
  const height = reader.height;
  const rgba = new Uint8ClampedArray(width * height * 4);

  const data: FileContainer = {
    filename: file.name,
    frames: [],
    width,
    height,
  };

  Array(reader.numFrames())
    .fill(0)
    .forEach((_, idx) => {
      const frameInfo = reader.frameInfo(idx);
      reader.decodeAndBlitFrameRGBA(idx, rgba);

      data.frames.push({
        delayInMs: frameInfo.delay * 10,
        data: new Uint8ClampedArray(rgba),
      });
    });

  return data;
}

export async function getVideoFromFrameData(
  data: FileContainer[],
): Promise<Blob> {
  const sourceW = data[0].width;
  const sourceH = data[0].height;
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

  const encoderConfig: VideoEncoderConfig = {
    codec: "avc1.42E01E",
    width: canvas.width,
    height: canvas.height,
    bitrate: 12_000_000,
  };

  const { supported } = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!supported) {
    throw new Error("VideoEncoder config not supported");
  }

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder error", e),
  });

  encoder.configure(encoderConfig);

  let timeMs = 0;
  data.forEach((datum) => {
    datum.frames.forEach((frame) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imageData = new ImageData(
        frame.data as any,
        datum.width,
        datum.height,
      );
      ctx.putImageData(imageData, 0, 0);

      const vf = new VideoFrame(canvas, {
        timestamp: timeMs * 1000,
        duration: frame.delayInMs * 1000,
      });

      encoder.encode(vf);
      vf.close();
      timeMs += frame.delayInMs;
    });
  });

  await encoder.flush();
  muxer.finalize();

  const { buffer } = muxer.target;
  const blob = new Blob([buffer], { type: "video/mp4" });
  return blob;
}
