import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { useImgCache } from "./hooks";
import { PoolList } from "./PoolList";
import { QueueList } from "./QueueList";
import {
  decodeGifFile,
  encodeMp4FromGifAssets,
  getPreviewBlobsFromGifAssets,
} from "./util";
import { type GifAsset, type QueueEntry, type QueueFormFields } from "./model";

interface VideoData {
  src: string | undefined;
  size: string;
}

export function Container() {
  const [videoData, setVideoData] = useState<VideoData>({
    src: undefined,
    size: "",
  });
  const [pool, setPool] = useState<Map<string, GifAsset>>(new Map());
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const queueFormRef = useRef<Map<string, QueueFormFields>>(new Map());

  const { addCache, removeCache } = useImgCache();

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const frameData = new Map<string, GifAsset>();
    const previewCanvas = new OffscreenCanvas(1, 1);

    for (const file of files) {
      const asset = await decodeGifFile(file);
      frameData.set(asset.id, asset);

      const blob = await getPreviewBlobsFromGifAssets(previewCanvas, asset);
      const blobUrl = URL.createObjectURL(blob);
      addCache(asset.id, blobUrl);
    }

    setPool((prev) => new Map([...prev, ...frameData]));
  };

  const addToQueue = (asset: GifAsset) => {
    const queueId = `${asset.id}__${crypto.randomUUID()}`;
    setQueue((prev) => [
      ...prev,
      {
        queueId,
        poolId: asset.id,
        filename: asset.filename,
      },
    ]);
    queueFormRef.current.set(queueId, { durationInS: 1 });
  };

  const removeFromPool = (removeId: string) => {
    setPool((prev) => {
      const next = new Map(prev);
      next.delete(removeId);
      return next;
    });
    setQueue((prev) => prev.filter((entry) => entry.poolId !== removeId));
    removeCache(removeId);
  };

  const removeFromQueue = (removeQueueId: string) => {
    setQueue((prev) => prev.filter((entry) => entry.queueId !== removeQueueId));
    queueFormRef.current.delete(removeQueueId);
  };

  const updateQueueDuration = (queueId: string, duration: string) => {
    const parsedDuration = Number.parseFloat(duration);
    const durationInS = Number.isFinite(parsedDuration)
      ? Math.max(0, parsedDuration)
      : 0;
    queueFormRef.current.set(queueId, { durationInS });
  };

  const composeVideo = async () => {
    setVideoData((prev) => {
      if (prev.src) {
        URL.revokeObjectURL(prev.src);
      }

      return {
        ...prev,
        src: undefined,
      };
    });

    const resolved = queue.map((entry) => ({
      ...pool.get(entry.poolId)!,
      ...queueFormRef.current.get(entry.queueId)!,
    }));
    const blob = await encodeMp4FromGifAssets(resolved);
    const blobUrl = URL.createObjectURL(blob);
    setVideoData({ src: blobUrl, size: (blob.size / 1024 / 1024).toFixed(2) });
  };

  useEffect(() => {
    // clean up blob urls during close
    return () => {
      if (videoData.src) {
        URL.revokeObjectURL(videoData.src);
      }
    };
  }, [videoData.src]);

  return (
    <div className="container">
      <div className="row">
        <div className="col-3 py-3 vh-100">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2">
            <h5 className="text-center">Pool</h5>

            <div className="text-center pb-2">
              <label className="btn btn-primary">
                Add files into Pool
                <input
                  type="file"
                  accept="image/gif"
                  multiple
                  onChange={handleChange}
                  className="d-none"
                />
              </label>
            </div>
            <PoolList
              items={[...pool.values()]}
              remove={removeFromPool}
              addToQueue={addToQueue}
            />
          </div>
        </div>
        <div className="col-3 py-3 vh-100">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2">
            <h5 className="text-center">Queue</h5>
            <QueueList
              items={queue}
              remove={removeFromQueue}
              updateDuration={updateQueueDuration}
            />
          </div>
        </div>
        <div className="col py-3">
          <div className="pb-2">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={composeVideo}
              disabled={queue.length === 0}
            >
              Compose video
            </button>
          </div>
          <div className="text-center">
            <video
              src={videoData.src}
              loop
              muted
              controls
              playsInline
              disablePictureInPicture
              controlsList="nofullscreen noremoteplayback"
              className="img-fluid"
            ></video>

            {videoData.src ? (
              <>
                <div className="py-2">Size: {videoData.size}MB</div>
                <a
                  href={videoData.src}
                  download="compiled.mp4"
                  className="btn btn-outline-primary"
                >
                  Download video
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
