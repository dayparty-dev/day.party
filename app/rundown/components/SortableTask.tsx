import { useState, useRef } from 'react';
import { Resizable } from 're-resizable';
import { useSortable } from '@dnd-kit/sortable';
import { useLongPress } from 'use-long-press';
import { TaskStatus } from '../../_models/Task';
import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import TagPopoverEditor from './TagPopoverEditor';
import { useTags } from 'app/_hooks/useTags';

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
  const { t } = useAppTranslation();

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

  const { getTagByKey } = useTags();
  const tag = task.tagKey ? getTagByKey(task.tagKey) : null;

  const tagRef = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);

  const handleUpdateTag = (taskId: string, newKey: string) => {
    // Aquí deberías actualizar la tarea, por ejemplo:
    // updateTask(taskId, { category: tags.find(tag => tag.key === newKey) });
  };

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

  // console.log('SortableTask', task);
  return (

    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-is-dragging={isDragging}
    >
      <Resizable
        size={{ width: '100%', height: 62 + (task.size * 30) }}
        enable={isEditMode ? { top: false, right: false, bottom: true, left: false } : {}}
        grid={[1, 60]}
        minHeight={60}
        onResize={(_e, _direction, _ref, d) => {
          const newSize = Math.max(1, Math.round((task.size * 60 + d.height) / 60));
          setTempSize(newSize);
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          const newSize = Math.max(1, Math.round((task.size * 60 + d.height) / 60));
          setTempSize(null);
          if (newSize !== task.size) {
            onResize(task._id, newSize);
          }
        }}
      >
        <div className={`relative group task-content bg-base-100 h-full shadow-md rounded-md border transition-shadow duration-200 hover:shadow-lg ${task.status === 'ongoing' ? 'border-2 border-green-500 bg-green-100' : 'border-b'}`}>
          {/* <div className={`task-content card bg-base-100 h-full shadow-md p-4 rounded-md border ${task.status === 'ongoing' ? 'border-2 border-green-500 bg-green-100' : 'border-b'}`}> */}
          {isEditMode && (
            <button
              className="btn btn-error btn-circle btn-sm absolute top-[-10px] right-[-10px] "
              onClick={() => onDelete(task._id)}
              aria-label={t('task.delete')}
            >
              ×
            </button>
          )}

          <div className="flex flex-col gap-2 h-full p-4" {...(isEditMode ? listeners : longPressBinding())}>
            {/* <div
              className="action"
              {...(isEditMode ? listeners : longPressBinding())}
            > */}
            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
              {task.title}
              {task.tagKey && (
                <span
                  ref={tagRef}
                  className="badge badge-sm cursor-pointer"
                  style={{
                    backgroundColor: tag.color,
                    color: '#fff',
                  }}
                  onClick={() => setEditing(true)}
                >
                  {tag.label}
                </span>
              )}
            </h3>

            {editing && (
              <TagPopoverEditor
                selectedKey={task.tagKey ?? null}
                anchorRef={tagRef}
                onSelect={handleUpdateTag}
                onClose={() => setEditing(false)}
              />
            )}
            <p className="text-sm text-gray-500">{t('task.duration', { minutes: (tempSize ?? task.size) * 15 })}</p>

            <div className="absolute right-1.5 bottom-1.5 flex justify-end items-center gap-2 mt-auto">
              <button
                className={`badge ${task.status === 'ongoing' ? 'badge-success' : task.status === 'paused' ? 'badge-warning' : task.status === 'done' ? 'badge-neutral' : 'badge-outline'}`}
                onClick={() => {
                  const nextStatus: TaskStatus =
                    { pending: 'ongoing', ongoing: 'paused', paused: 'ongoing', done: 'pending' }[task.status] || 'pending';
                  onStatusChange(task._id, nextStatus);
                }}
                aria-pressed={task.status === 'ongoing'}
                aria-label={t('task.status.' + task.status)}
              >
                {t('task.status.' + task.status)}
              </button>

              {task.status !== 'done' && (
                <button
                  className="btn btn-success btn-circle btn-xs"
                  onClick={() => onStatusChange(task._id, 'done')}
                  aria-label={t('task.markDone')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {isEditMode && (
            <div className="absolute bottom-0 left-0 w-full h-[6px] bg-black/10 rounded-b-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
          )}
        </div>
      </Resizable>
    </div >
  );
};

export default SortableTask;
