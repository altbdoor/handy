import { useImgCache } from "./hooks";
import type { QueueEntry } from "./model";

interface QueueListProps {
  items: QueueEntry[];
  remove: (id: string) => void;
  updateDuration: (id: string, val: string) => void;
}

export function QueueList({ items, ...props }: QueueListProps) {
  const { getCache } = useImgCache();

  return (
    <div className="d-flex flex-column gap-1">
      {items.map((entry) => (
        <div key={entry.queueId} className="rounded bg-dark p-2">
          <div className="d-flex gap-2">
            <div>
              <img
                src={getCache(entry.poolId)}
                alt={entry.filename}
                width={64}
                height={64}
                className="object-fit-cover"
              />
            </div>
            <div className="min-width-0">
              <div className="pb-2 text-truncate">{entry.filename}</div>

              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => props.remove(entry.queueId)}
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
                        entry.queueId,
                        evt.currentTarget.value,
                      )
                    }
                    defaultValue={1}
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
