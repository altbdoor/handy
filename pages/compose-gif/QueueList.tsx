import { useImgCache } from "./hooks";
import type { GifAsset } from "./util";

interface QueueListProps {
  items: GifAsset[];
  remove: (id: string) => void;
  updateDuration: (id: string, val: string) => void;
}

export function QueueList({ items, ...props }: QueueListProps) {
  const { getCache } = useImgCache();

  return (
    <div className="d-flex flex-column gap-1">
      {items.map((asset) => (
        <div key={asset.queueId} className="rounded bg-dark p-2">
          <div className="d-flex gap-2">
            <div>
              <img
                src={getCache(asset.id)}
                alt={asset.filename}
                width={64}
                height={64}
                className="object-fit-cover"
              />
            </div>
            <div className="min-width-0">
              <div className="pb-2 text-truncate">{asset.filename}</div>

              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => props.remove(asset.queueId)}
                >
                  <i className="bi bi-trash-fill"></i>
                </button>

                <div className="input-group input-group-sm">
                  <input
                    className="form-control text-end"
                    type="number"
                    min={0.001}
                    step={0.1}
                    onChange={(evt) =>
                      props.updateDuration(
                        asset.queueId,
                        evt.currentTarget.value,
                      )
                    }
                    value={asset.durationInS}
                  />
                  <span className="input-group-text">s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
