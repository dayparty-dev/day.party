import { useState } from 'react';
import { Resizable } from 're-resizable';
import { useSortable } from '@dnd-kit/sortable';
import { useLongPress } from 'use-long-press';
import { TaskStatus } from '../../_models/Task';

interface SortableTaskProps {
  task: any; // Replace with proper Task type
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onResize: (id: string, size: number) => void;
  onLongPress: () => void;
}

const SortableTask = ({
  task,
  isEditMode,
  onDelete,
  onStatusChange,
  onResize,
  onLongPress,
}: SortableTaskProps) => {
  const [tempSize, setTempSize] = useState<number | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
  });

  const longPressBinding = useLongPress(
    () => {
      onLongPress();
    },
    {
      threshold: 500,
      cancelOnMovement: true,
    }
  );

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    position: 'relative',
    zIndex: isDragging ? 999 : 0,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    cursor: isEditMode ? 'grab' : 'default',
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-is-dragging={isDragging}
    >
      <Resizable
        size={{ width: '100%', height: task.size * 60 }}
        enable={
          isEditMode
            ? {
                top: false,
                right: false,
                bottom: true,
                left: false,
              }
            : {}
        }
        grid={[1, 60]}
        minHeight={60}
        onResize={(_e, _direction, _ref, d) => {
          const newSize = Math.max(
            1,
            Math.round((task.size * 60 + d.height) / 60)
          );
          setTempSize(newSize);
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          const newSize = Math.max(
            1,
            Math.round((task.size * 60 + d.height) / 60)
          );
          setTempSize(null);
          if (newSize !== task.size) {
            onResize(task._id, newSize);
          }
        }}
      >
        <div
          className={`task-content ${
            task.status === 'ongoing' ? 'ongoing' : ''
          }`}
        >
          {isEditMode && (
            <button
              className="delete-btn"
              onClick={() => onDelete(task._id)}
              aria-label="Delete task"
            >
              ×
            </button>
          )}
          <div
            className="action"
            {...(isEditMode ? listeners : longPressBinding())}
          >
            <h3>{task.title}</h3>
            <p className="duration">{(tempSize ?? task.size) * 15} mins</p>
            <div className="status-controls">
              <button
                className={`status ${task.status}`}
                onClick={() => {
                  const nextStatus: TaskStatus =
                    {
                      pending: 'ongoing',
                      ongoing: 'paused',
                      paused: 'ongoing',
                      done: 'pending',
                    }[task.status] || 'pending';
                  onStatusChange(task._id, nextStatus);
                }}
                aria-pressed={task.status === 'ongoing'}
                aria-label={`Toggle task status: currently ${task.status}`}
              >
                {task.status}
              </button>
              {task.status !== 'done' && (
                <button
                  className="finish-btn"
                  onClick={() => onStatusChange(task._id, 'done')}
                  aria-label="Mark task as done"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </Resizable>
    </div>
  );
};

export default SortableTask;
