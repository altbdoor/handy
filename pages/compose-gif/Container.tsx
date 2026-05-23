import { useEffect, useState, type ChangeEventHandler } from "react";
import { useImgCache } from "./hooks";
import { PoolList } from "./PoolList";
import { QueueList } from "./QueueList";
import {
  decodeGifFile,
  encodeMp4FromGifAssets,
  getPreviewBlobsFromGifAssets,
  type GifAsset,
} from "./util";

interface VideoData {
  src: string | undefined;
  size: string;
}

export function Container() {
  const [videoData, setVideoData] = useState<VideoData>({
    src: undefined,
    size: "",
  });
  const [pool, setPool] = useState<GifAsset[]>([]);
  const [queue, setQueue] = useState<GifAsset[]>([]);

  const { addCache, removeCache, clearCache } = useImgCache();

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const frameData = await Promise.all(
      files.map((file) => decodeGifFile(file)),
    );

    const blobs = await getPreviewBlobsFromGifAssets(frameData);
    blobs.forEach((blob, index) => {
      const blobUrl = URL.createObjectURL(blob);
      addCache(frameData[index].id, blobUrl);
    });

    setPool((prev) => [...prev, ...frameData]);
  };

  const addToQueue = (container: GifAsset) => {
    setQueue((prev) => {
      return [
        ...prev,
        { ...container, queueId: `${container.id}__${crypto.randomUUID()}` },
      ];
    });
  };

  const removeFromPool = (removeId: string) => {
    setQueue((prev) => prev.filter((datum) => datum.id !== removeId));
    setPool((prev) => prev.filter((datum) => datum.id !== removeId));
    removeCache(removeId);
  };

  const removeFromQueue = (removeQueueId: string) => {
    setQueue((prev) => prev.filter((datum) => datum.queueId !== removeQueueId));
  };

  const updateQueueDuration = (queueId: string, duration: string) => {
    const parsedDuration = Number.parseFloat(duration);
    const durationInS = Number.isFinite(parsedDuration)
      ? Math.max(0, parsedDuration)
      : 0;

    setQueue((prev) =>
      prev.map((datum) => {
        if (datum.queueId !== queueId) {
          return datum;
        }

        return {
          ...datum,
          durationInS,
        };
      }),
    );
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

    const blob = await encodeMp4FromGifAssets(queue);
    const blobUrl = URL.createObjectURL(blob);
    setVideoData({ src: blobUrl, size: (blob.size / 1024 / 1024).toFixed(2) });
  };

  useEffect(() => {
    // clean up blob urls during close
    return () => {
      if (videoData.src) {
        URL.revokeObjectURL(videoData.src);
      }

      clearCache();
    };
  }, [videoData.src, clearCache]);

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
              items={pool}
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
