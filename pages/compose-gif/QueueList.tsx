import {
  DragDropContext,
  Draggable,
  Droppable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd";
import { FORM_ID } from "./constants";
import type { QueueEntry } from "./model";

interface QueueItemProps {
  entry: QueueEntry;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  move: (from: number, to: number) => void;
  remove: (id: string, previewUrl: string) => void;
}

function QueueItem({
  entry,
  idx,
  isFirst,
  isLast,
  move,
  remove,
}: QueueItemProps) {
  return (
    <div className="rounded bg-dark p-2">
      <div className="d-flex gap-2">
        <div className="d-flex flex-column gap-1">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => move(idx, idx - 1)}
            disabled={isFirst}
          >
            <i className="bi bi-arrow-up"></i>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => move(idx, idx + 1)}
            disabled={isLast}
          >
            <i className="bi bi-arrow-down"></i>
          </button>
        </div>
        <div>
          <img
            src={entry.previewUrl}
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
              onClick={() => remove(entry.id, entry.previewUrl)}
            >
              <i className="bi bi-trash-fill"></i>
            </button>

            <div className="input-group input-group-sm">
              <input
                className="form-control text-end"
                type="number"
                name="duration"
                form={FORM_ID}
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
  );
}

interface QueueListProps {
  items: QueueEntry[];
  remove: (id: string, previewUrl: string) => void;
  move: (from: number, to: number) => void;
}

export function QueueList({ items, ...props }: QueueListProps) {
  if (items.length === 0) {
    return (
      <div className="p-3 text-center">
        <i className="bi bi-info-circle"></i> No files in queue. Add files with
        the upload button above.
      </div>
    );
  }

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    props.move(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="queue">
        {(dropProv) => (
          <div
            ref={dropProv.innerRef}
            {...dropProv.droppableProps}
            className="d-flex flex-column"
          >
            {items.map((entry, idx) => (
              <Draggable key={entry.id} draggableId={entry.id} index={idx}>
                {(dragProv, snapshot) => (
                  <div
                    ref={dragProv.innerRef}
                    {...dragProv.draggableProps}
                    {...dragProv.dragHandleProps}
                    className={
                      "pb-1 " + (snapshot.isDragging ? "opacity-50" : "")
                    }
                  >
                    <QueueItem
                      entry={entry}
                      idx={idx}
                      isFirst={idx === 0}
                      isLast={idx === items.length - 1}
                      move={props.move}
                      remove={props.remove}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {dropProv.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
