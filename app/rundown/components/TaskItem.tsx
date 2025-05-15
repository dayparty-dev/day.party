import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTags } from 'app/_hooks/useTags';
import { useTasks } from 'app/_hooks/useTasks';
import { Resizable } from 're-resizable';
import { useRef, useState } from 'react';
import { useLongPress } from 'use-long-press';
import { Task, TaskStatus } from '../../_models/Task';
import { DropIndicator } from '../hooks/useTaskIndicators';
import EndTaskModal from './EndTaskModal';
import TagPopoverEditor from './TagPopoverEditor';
import "./Task.scss";

interface TaskItemProps {
  task: Task;
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onResize: (id: string, size: number) => void;
  onLongPress: () => void;

  // New props for the indicator system
  isDragging: boolean;
  isBeingDragged: boolean;
  dropIndicator: DropIndicator | null;
  onStartDrag: (task: Task, e?: React.MouseEvent) => void;
  onShowIndicator: (taskId: string, position: 'before' | 'after' | 'inside') => void;
}

const TaskItem = ({
  task,
  isEditMode,
  onDelete,
  onStatusChange,
  onResize,
  onLongPress,
  isDragging,
  isBeingDragged,
  dropIndicator,
  onStartDrag,
  onShowIndicator,
}: TaskItemProps) => {
  const { t } = useAppTranslation();
  const { updateTask } = useTasks();

  const [tempSize, setTempSize] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(task.elapsed ?? 0);
  const [showEndModal, setShowEndModal] = useState(false);

  const BASE_HEIGHT = 62; // Base height for tasks

  const { getTagByKey } = useTags();
  const tag = task.tagKey ? getTagByKey(task.tagKey) : null;

  const tagRef = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateTag = (newKey: string) => {
    updateTask(task._id, { tagKey: newKey });
  };

  const longPressBinding = useLongPress(() => {
    if (!isEditMode) {
      onLongPress();
    }
  }, {
    threshold: 500,
    captureEvent: true,
    cancelOnMovement: false,
  });

  // Handle elapsed time updates
  const handleMouseDownLeft = () => {
    setElapsed(prev => {
      const next = Math.max(0, prev - 60);
      updateTask(task._id, { elapsed: next });
      return next;
    });

    holdIntervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = Math.max(0, prev - 60);
        updateTask(task._id, { elapsed: next });
        return next;
      });
    }, 300);
  };

  const handleMouseUpLeft = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const handleMouseDownRight = () => {
    setElapsed(prev => {
      const next = Math.min(prev + 60, task.duration * 60);
      updateTask(task._id, { elapsed: next });
      return next;
    });

    holdIntervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = Math.min(prev + 60, task.duration * 60);
        updateTask(task._id, { elapsed: next });
        return next;
      });
    }, 300);
  };

  const handleMouseUpRight = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  // Handle task drag action
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isEditMode) return;

    // Prevent text selection during drag start
    e.preventDefault();

    // Start the drag operation with the mouse event
    onStartDrag(task, e);
    e.stopPropagation();
  };

  // Check for indicators
  const showsBeforeIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'before';
  const showsAfterIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'after';
  const showsInsideIndicator = dropIndicator?.targetId === task._id && dropIndicator?.position === 'inside';

  // Handle hover to show indicators
  const handleTaskHover = (e: React.MouseEvent) => {
    if (!isDragging || isBeingDragged) return;

    // Add a hover class to the task card for better visual feedback
    e.currentTarget.classList.add('drag-hover');

    // Calculate position based on mouse position within the task
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Determine which action to show based on position:
    // - Top 30% = before (bigger area to make easier to reach)
    // - Bottom 30% = after (bigger area to make easier to reach)
    // - Middle 40% = inside (make it a subtask)
    const topThreshold = rect.height * 0.3;
    const bottomThreshold = rect.height * 0.7;

    if (relativeY < topThreshold) {
      onShowIndicator(task._id, 'before');
    } else if (relativeY > bottomThreshold) {
      onShowIndicator(task._id, 'after');
    } else {
      onShowIndicator(task._id, 'inside');
    }

    // Setup a handler to remove the hover class when mouse leaves
    const handleMouseLeave = () => {
      e.currentTarget.classList.remove('drag-hover');
      e.currentTarget.removeEventListener('mouseleave', handleMouseLeave);
    };

    e.currentTarget.addEventListener('mouseleave', handleMouseLeave);
  };

  return (
    <div
      id={`task-${task._id}`}
      className={`
        relative task-card
        ${isBeingDragged ? 'opacity-50' : ''}
        ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      onMouseMove={handleTaskHover}
      data-task-id={task._id}
    >
      {/* Drop indicators - using our new CSS classes */}
      <div className={`indicator-line before ${showsBeforeIndicator ? 'visible' : ''}`}></div>
      <div className={`indicator-line after ${showsAfterIndicator ? 'visible' : ''}`}></div>
      <div className={`indicator-inside ${showsInsideIndicator ? 'visible' : ''}`}></div>

      <Resizable
        size={{ width: '100%', height: BASE_HEIGHT + ((task.duration - 15) * 2) }}
        enable={isEditMode ? { top: false, right: false, bottom: true, left: false } : {}}
        grid={[1, 30]}
        minHeight={BASE_HEIGHT + 30}
        onResize={(_e, _direction, _ref, d) => {
          const newSize = Math.max(1, Math.round((BASE_HEIGHT + (task.duration - 15) * 2 + d.height - BASE_HEIGHT) / 30));
          setTempSize(newSize);
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          const newSize = Math.max(1, Math.round((BASE_HEIGHT + (task.duration - 15) * 2 + d.height - BASE_HEIGHT) / 30));
          setTempSize(null);
          if (newSize !== task.size) {
            onResize(task._id, newSize);
          }
        }}
      >
        <div className={`relative group task-content z-10 bg-base-100 h-full shadow-md rounded-md border transition-shadow duration-200 hover:shadow-lg ${task.status === 'ongoing' ? 'border-2 border-green-500 bg-green-100' : 'border-b'}`}>
          {/* Background progress bar */}
          {(task.status === 'ongoing' || task.status === 'paused') && (
            <div className="absolute top-0 left-0 w-full h-full rounded-md overflow-hidden z-0">
              <div
                className={`h-full ${task.status === 'ongoing' ? "bg-green-300" : "bg-yellow-100"} transition-all duration-300 ease-linear pointer-events-none`}
                style={{
                  width: `${Math.min(100, (elapsed / (task.duration * 60)) * 100)}%`,
                }}
              />
            </div>
          )}

          {/* Task content */}
          <div
            className="flex flex-col gap-2 h-full p-4 z-10 relative"
            {...(isEditMode ? { onMouseDown: handleDragStart } : longPressBinding())}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap mix-blend-difference">
              {task.title}
              {task.tagKey ? (
                <span
                  ref={tagRef}
                  className={`badge badge-sm ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    backgroundColor: tag?.color,
                    color: '#fff',
                  }}
                  onClick={isEditMode ? () => setEditing(true) : undefined}
                >
                  {tag?.label}
                </span>
              ) : (
                <span
                  className={`badge badge-sm bg-base-200 text-base-content ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={isEditMode ? () => setEditing(true) : undefined}
                >
                  +
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {`${t('task.duration', { minutes: task.duration ?? "" })} (${Math.floor(elapsed / 60)})`}
            </p>

            <div className="absolute right-1.5 bottom-1.5 flex justify-end items-center gap-2 mt-auto z-30">
              <button
                className={`badge ${task.status === 'ongoing' ? 'badge-success' : task.status === 'paused' ? 'badge-warning' : task.status === 'done' ? 'badge-neutral' : 'badge-outline'}`}
                onClick={() => {
                  const statusMap: Record<TaskStatus, TaskStatus> = {
                    pending: 'ongoing',
                    ongoing: 'paused',
                    paused: 'ongoing',
                    done: 'pending',
                  };
                  const nextStatus = statusMap[task.status];
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

          {/* Time progress for Ongoing */}
          {(isEditMode && task.status === 'ongoing') && (
            <>
              <div
                className="absolute top-0 left-0 h-full w-1/2 z-20 cursor-pointer"
                onMouseDown={handleMouseDownLeft}
                onMouseUp={handleMouseUpLeft}
                onMouseLeave={handleMouseUpLeft}
                onTouchStart={handleMouseDownLeft}
                onTouchEnd={handleMouseUpLeft}
                onDoubleClick={() => {
                  setElapsed(prev => {
                    const next = Math.max(0, prev - 60);
                    updateTask(task._id, { elapsed: next });
                    return next;
                  });
                }}
              />
              <div
                className="absolute top-0 right-0 h-full w-1/2 z-20 cursor-pointer"
                onMouseDown={handleMouseDownRight}
                onMouseUp={handleMouseUpRight}
                onMouseLeave={handleMouseUpRight}
                onTouchStart={handleMouseDownRight}
                onTouchEnd={handleMouseUpRight}
                onDoubleClick={() => {
                  setElapsed(prev => {
                    const next = Math.min(prev + 60, task.duration * 60);
                    updateTask(task._id, { elapsed: next });
                    return next;
                  });
                }}
              />
            </>
          )}

          {/* Delete Task */}
          {isEditMode && (
            <button
              className="btn btn-error btn-circle btn-sm absolute top-[-10px] right-[-10px] z-30"
              onClick={() => onDelete(task._id)}
              aria-label={t('task.delete')}
            >
              ×
            </button>
          )}

          {/* Resize Task */}
          {isEditMode && (
            <div className="absolute bottom-0 left-0 w-full h-[6px] bg-black/10 rounded-b-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-30" />
          )}
        </div>
      </Resizable>

      {editing && (
        <TagPopoverEditor
          selectedKey={task.tagKey ?? null}
          anchorRef={tagRef}
          onSelect={handleUpdateTag}
          onClose={() => setEditing(false)}
        />
      )}

      {showEndModal && <EndTaskModal
        task={task}
        setShowEndModal={setShowEndModal}
        setElapsed={setElapsed}
        elapsed={elapsed}
      />}
    </div>
  );
};

export default TaskItem;
