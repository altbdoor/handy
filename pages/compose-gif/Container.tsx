import { useState, useEffect, useRef, type ChangeEventHandler } from "react";
import { QueueList } from "./QueueList";
import { decodeGifFile, encodeIntoVideo } from "./util";
import type { QueueEntry } from "./model";
import { Preview } from "./Preview";

export function Container() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const canvas = new OffscreenCanvas(1, 1);
    const newEntries: typeof queue = [];

    for (const file of files) {
      const entry = await decodeGifFile(file, canvas);
      previewUrls.current.push(entry.previewUrl);
      newEntries.push(entry);
    }

    setQueue((prev) => [...prev, ...newEntries]);
  };

  const removeFromQueue = (removeId: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current = previewUrls.current.filter(
      (url) => url !== previewUrl,
    );
    setQueue((prev) => prev.filter((item) => item.id !== removeId));
  };

  const clearQueue = () => {
    previewUrls.current.forEach(URL.revokeObjectURL);
    previewUrls.current = [];
    setQueue([]);
  };

  const moveQueue = (from: number, to: number) => {
    if (to < 0 || from === to) {
      return;
    }

    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const compose = async (fd: FormData) => {
    if (queue.length === 0) {
      return;
    }

    const durations = fd.getAll("duration") as string[];
    const renderSize = parseInt(fd.get("renderSize") as string, 10);
    const rotation = parseInt(fd.get("rotation") as string, 10);
    const useFfmpeg = (fd.get("useFfmpeg") as string) === "yes";

    const resolved = queue.map((entry, idx) => ({
      ...entry,
      durationInS: Number.parseFloat(durations[idx]) ?? 0,
    }));

    const blob = encodeIntoVideo(resolved, renderSize, useFfmpeg, rotation);
    return blob;
  };

  return (
    <div className="container position-relative">
      <div className="row">
        <div className="col-4 py-3 vh-100 position-sticky top-0">
          <div className="h-100 bg-secondary text-white overflow-y-scroll p-2 overflow-anchor-none">
            <div className="d-flex align-items-center gap-1 pb-2">
              <h5 className="m-0">
                <i className="bi bi-layers"></i> Queue
              </h5>

              <label className="btn btn-primary btn-sm ms-auto">
                Upload GIFs
                <input
                  type="file"
                  accept="image/gif"
                  multiple
                  onChange={handleChange}
                  className="d-none"
                />
              </label>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={clearQueue}
              >
                Clear
              </button>
            </div>

            <QueueList
              items={queue}
              remove={removeFromQueue}
              move={moveQueue}
            />
          </div>
        </div>
        <div className="col py-3">
          <h5 className="m-0 pt-2">
            <i className="bi bi-file-play"></i> Preview
          </h5>

          <Preview onCompose={compose} />
        </div>
      </div>
    </div>
  );
}
