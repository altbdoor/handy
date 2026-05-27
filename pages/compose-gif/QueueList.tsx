import { useImgCache } from "./hooks";
import type { QueueEntry } from "./model";

interface QueueListProps {
  formId: string;
  items: QueueEntry[];
  remove: (id: string) => void;
  move: (from: number, to: number) => void;
}

export function QueueList({ items, ...props }: QueueListProps) {
  const { getCache } = useImgCache();

  if (items.length === 0) {
    return (
      <div className="p-3 text-center">
        <i className="bi bi-info-circle"></i> No files in queue. Add files in
        from the pool.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-1">
      {items.map((entry, idx) => (
        <div key={entry.queueId} className="rounded bg-dark p-2">
          <div className="d-flex gap-2">
            <div className="d-flex flex-column gap-1">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => props.move(idx, idx - 1)}
                disabled={idx === 0}
              >
                <i className="bi bi-arrow-up"></i>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => props.move(idx, idx + 1)}
                disabled={idx === items.length - 1}
              >
                <i className="bi bi-arrow-down"></i>
              </button>
            </div>
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
                    name="duration"
                    form={props.formId}
                    min={0}
                    max={600}
                    step="any"
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
