import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { decodeGifFile, encodeMp4FromGifAssets, type GifAsset } from "./util";

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

  const previewImageCache = useRef<{ [key: string]: string }>({});

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const frameData = await Promise.all(
      files.map((file) => decodeGifFile(file)),
    );

    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext("2d")!;

    for (const asset of frameData) {
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
      const blobUrl = URL.createObjectURL(blob);
      previewImageCache.current[asset.id] = blobUrl;
    }

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

    const blobUrl = previewImageCache.current[removeId];
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    delete previewImageCache.current[removeId];
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

      Object.values(previewImageCache.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

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

            <div className="d-flex flex-column gap-1">
              {pool.map((asset) => (
                <div key={asset.id} className="rounded bg-dark p-2">
                  <div className="d-flex gap-2">
                    <div>
                      <img
                        src={previewImageCache.current[asset.id]}
                        alt={asset.filename}
                        width={64}
                        height={64}
                        className="object-fit-cover"
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="mb-2 text-truncate">{asset.filename}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeFromPool(asset.id)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary ms-2"
                        onClick={() => addToQueue(asset)}
                      >
                        <i className="bi bi-arrow-right-circle"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-3 py-3 vh-100">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2">
            <h5 className="text-center">Queue</h5>

            <div className="d-flex flex-column gap-1">
              {queue.map((asset) => (
                <div key={asset.queueId} className="rounded bg-dark p-2">
                  <div className="d-flex gap-2">
                    <div>
                      <img
                        src={previewImageCache.current[asset.id]}
                        alt={asset.filename}
                        width={64}
                        height={64}
                        className="object-fit-cover"
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="mb-2 text-truncate">{asset.filename}</div>

                      <div className="d-flex gap-1">
                        <div className="input-group input-group-sm">
                          <input
                            className="form-control text-end"
                            type="number"
                            min={0.001}
                            step={0.1}
                            onChange={(evt) =>
                              updateQueueDuration(
                                asset.queueId,
                                evt.currentTarget.value,
                              )
                            }
                            value={asset.durationInS}
                          />
                          <span className="input-group-text">seconds</span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromQueue(asset.queueId)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col py-3">
          <div className="mb-2">
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
