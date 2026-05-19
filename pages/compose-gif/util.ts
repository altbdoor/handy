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

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = sourceW * 2;
  canvas.height = sourceH * 2;
  ctx.imageSmoothingEnabled = false;

  const tmpImgCanvas = document.createElement("canvas");
  const tmpImgCtx = tmpImgCanvas.getContext("2d")!;
  tmpImgCanvas.width = sourceW;
  tmpImgCanvas.height = sourceH;
  tmpImgCtx.imageSmoothingEnabled = false;

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
    bitrate: 2_500_000,
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
      tmpImgCtx.clearRect(0, 0, tmpImgCanvas.width, tmpImgCanvas.height);

      // image data cannot be resized. parked into a tmp canvas
      const imageData = new ImageData(frame.data as any, sourceW, sourceH);
      tmpImgCtx.putImageData(imageData, 0, 0);

      ctx.drawImage(
        tmpImgCanvas,
        0,
        0,
        sourceW,
        sourceH,
        0,
        0,
        sourceW * 2,
        sourceH * 2,
      );

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
