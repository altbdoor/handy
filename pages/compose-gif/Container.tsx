import { useEffect, useState, type ChangeEventHandler } from "react-compat";
import { decodeGifFile, encodeMp4FromGifAssets, type GifAsset } from "./util";

export function Container() {
  const [videoSrc, setVideoSrc] = useState("");
  const [pool, setPool] = useState<GifAsset[]>([]);
  const [queue, setQueue] = useState<GifAsset[]>([]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const frameData = await Promise.all(
      files.map((file) => decodeGifFile(file)),
    );
    setPool((prev) => [...prev, ...frameData]);
  };

  const addToQueue = (container: GifAsset) => {
    setQueue((prev) => [...prev, container]);
  };

  const removeFromPool = (removeId: string) => {
    setQueue((prev) => prev.filter((datum) => datum.id !== removeId));
    setPool((prev) => prev.filter((datum) => datum.id !== removeId));
  };

  const updateQueueDuration = (idx: number, duration: string) => {
    const parsedDuration = Number.parseFloat(duration);
    const durationInS = Number.isFinite(parsedDuration)
      ? Math.max(0, parsedDuration)
      : 0;

    setQueue((prev) =>
      prev.map((datum, prevIdx) => {
        if (prevIdx !== idx) {
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
    const blob = await encodeMp4FromGifAssets(queue);
    console.log(blob.size);
    const blobUrl = URL.createObjectURL(blob);
    setVideoSrc((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }

      return blobUrl;
    });
  };

  useEffect(() => {
    // clean up blob url during close
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return (
    <div className="container">
      <div>
        <h3>Frames</h3>
        <ol>
          {pool.map((datum) => (
            <li key={datum.id}>
              <span>{datum.filename}</span>
              <button type="button" onClick={() => addToQueue(datum)}>
                Add
              </button>
              <button type="button" onClick={() => removeFromPool(datum.id)}>
                Remove
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3>Queue</h3>
        <ol>
          {queue.map((datum, idx) => (
            <li key={datum.id + "__" + idx}>
              <div>{datum.filename}</div>
              <input
                type="number"
                min={0.001}
                step={0.1}
                onChange={(evt) =>
                  updateQueueDuration(idx, evt.currentTarget.value)
                }
                value={datum.durationInS}
              />
            </li>
          ))}
        </ol>
      </div>

      <p>gif to mp4</p>
      <p>
        <input
          type="file"
          accept="image/gif"
          multiple
          onChange={handleChange}
        />

        <button type="button" onClick={composeVideo}>
          Compose video
        </button>
      </p>
      <p>
        <video src={videoSrc} loop muted controls></video>
      </p>
    </div>
  );
}
