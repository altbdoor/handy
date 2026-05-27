import { useState, type ChangeEventHandler } from "react";
import { useImgCache } from "./hooks";
import { PoolList } from "./PoolList";
import { QueueList } from "./QueueList";
import {
  decodeGifFile,
  encodeMp4FromGifAssets,
  getPreviewBlobsFromGifAssets,
} from "./util";
import { type GifAsset, type QueueEntry } from "./model";
import { Preview } from "./Preview";

const FORM_ID = "compose-form";

export function Container() {
  const [pool, setPool] = useState<Map<string, GifAsset>>(new Map());
  const [queue, setQueue] = useState<QueueEntry[]>([]);

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
  };

  const moveQueue = (from: number, to: number) => {
    setQueue((prev) => {
      if (to < 0 || to >= prev.length) {
        return prev;
      }

      return prev.map((item, idx) => {
        if (idx === from) {
          return prev[to];
        }
        if (idx === to) {
          return prev[from];
        }
        return item;
      });
    });
  };

  const compose = async (fd: FormData) => {
    if (queue.length === 0) {
      return;
    }

    const durations = fd.getAll("duration") as string[];
    const renderSize = parseInt(fd.get("renderSize") as string, 10);
    const bgColor = fd.get("bgColor") as string;

    const resolved = queue.map((entry, idx) => ({
      ...pool.get(entry.poolId)!,
      durationInS: Number.parseFloat(durations[idx]) ?? 0,
    }));

    const blob = encodeMp4FromGifAssets(resolved, renderSize, bgColor);
    return blob;
  };

  return (
    <div className="container position-relative">
      <div className="row">
        <div className="col-3 py-3 vh-100 position-sticky top-0">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2">
            <div className="d-flex align-items-center justify-content-between pb-2">
              <h5 className="m-0">
                <i className="bi bi-archive"></i> Pool
              </h5>

              <label className="btn btn-primary btn-sm">
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
        <div className="col-3 py-3 vh-100 position-sticky top-0">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2">
            <div className="d-flex align-items-center justify-content-between pb-2">
              <h5 className="m-0">
                <i className="bi bi-layers"></i> Queue
              </h5>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setQueue([])}
              >
                Clear queue
              </button>
            </div>

            <QueueList
              items={queue}
              remove={removeFromQueue}
              move={moveQueue}
              formId={FORM_ID}
            />
          </div>
        </div>
        <div className="col py-3">
          <h5 className="m-0 pt-2">
            <i className="bi bi-file-play"></i> Preview
          </h5>

          <Preview formId={FORM_ID} onCompose={compose} />
        </div>
      </div>
    </div>
  );
}
