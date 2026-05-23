import { useImgCache } from "./hooks";
import type { GifAsset } from "./util";

interface PoolListProps {
  items: GifAsset[];
  remove: (id: string) => void;
  addToQueue: (asset: GifAsset) => void;
}

export function PoolList({ items, ...props }: PoolListProps) {
  const { getCache } = useImgCache();

  return (
    <div className="d-flex flex-column gap-1">
      {items.map((asset) => (
        <div key={asset.id} className="rounded bg-dark p-2">
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
                  className="btn btn-sm btn-danger"
                  onClick={() => props.remove(asset.id)}
                >
                  <i className="bi bi-trash-fill"></i>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => props.addToQueue(asset)}
                >
                  <i className="bi bi-arrow-right-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
