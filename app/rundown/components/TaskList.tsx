import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTasks } from 'app/_hooks/useTasks';
import { useZustandDebug } from 'app/_hooks/useZustandDebug';
import { Task, TaskStatus } from 'app/_models/Task';
import { useTaskStore } from 'app/_stores/useTaskStore';
import { useEffect, useMemo, useRef } from 'react';
import { useTaskIndicators } from '../hooks/useTaskIndicators';
import { useTaskUtils } from '../hooks/useTaskUtils';
import TaskGroup from './TaskGroup';
import TaskItem from './TaskItem';

interface TaskListProps {
  isEditMode: boolean;
  onLongPress: () => void;
  setIsEditMode: (isEdit: boolean) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  isEditMode,
  onLongPress,
  setIsEditMode,
}) => {
  const { t } = useAppTranslation();
  const prevTasksRef = useRef<Task[]>([]);

  const {
    tasksByDate,
    updateTask,
    deleteTask,
    setTasks,
    currentDate,
    dayCapacity,
    currentDayTasks,
  } = useTasks();

  // Debug hook to track task state changes
  useZustandDebug(
    useTaskStore,
    (state) => ({
      currentDayTasks: state.currentDayTasks,
      taskCount: state.currentDayTasks.length,
      subtaskCounts: state.currentDayTasks
        .filter(t => t.subtasks?.length)
        .map(t => ({ id: t._id, count: t.subtasks?.length }))
    }),
    'TaskStore'
  );

  const { ensureOneOngoingTask } = useTaskUtils({ tasksByDate, setTasks, updateTask, currentDayTasks });
  const {
    dropIndicator,
    draggedTask,
    startDrag,
    cancelDrag,
    showIndicator,
    handleTaskMove
  } = useTaskIndicators();

  // Derived state
  const isDragging = !!draggedTask;

  // Detect duplicate tasks and clean them up
  useEffect(() => {
    if (!isDragging && currentDayTasks?.length) {
      // Check if there are any duplicate IDs in the main task list
      const taskIds = new Set<string>();
      const duplicateIds = new Set<string>();

      // Find duplicates in the main list
      currentDayTasks.forEach(task => {
        if (taskIds.has(task._id)) {
          duplicateIds.add(task._id);
        } else {
          taskIds.add(task._id);
        }

        // Also check subtasks for duplicates
        if (task.subtasks?.length) {
          const subtaskIds = new Set<string>();
          task.subtasks.forEach(subtask => {
            if (subtaskIds.has(subtask._id)) {
              duplicateIds.add(subtask._id);
            }
            subtaskIds.add(subtask._id);
          });
        }
      });

      // If duplicates found, fix them
      if (duplicateIds.size > 0) {
        console.warn("Duplicate tasks detected:", duplicateIds);

        // Clean up by keeping only the first instance of each task
        const uniqueTasks: Task[] = [];
        const seenIds = new Set<string>();

        currentDayTasks.forEach(task => {
          if (!seenIds.has(task._id)) {
            seenIds.add(task._id);

            // Also dedupe subtasks if present
            if (task.subtasks?.length) {
              const uniqueSubtasks: Task[] = [];
              const seenSubtaskIds = new Set<string>();

              task.subtasks.forEach(subtask => {
                if (!seenSubtaskIds.has(subtask._id)) {
                  seenSubtaskIds.add(subtask._id);
                  uniqueSubtasks.push(subtask);
                }
              });

              uniqueTasks.push({
                ...task,
                subtasks: uniqueSubtasks
              });
            } else {
              uniqueTasks.push(task);
            }
          }
        });

        // Update task store with deduped tasks
        const dateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
        const newTasksByDate = { ...tasksByDate };
        newTasksByDate[dateKey] = uniqueTasks;
        setTasks(newTasksByDate);
      }

      prevTasksRef.current = currentDayTasks;
    }
  }, [currentDayTasks, isDragging, tasksByDate, currentDate, setTasks]);

  // Only check for multiple ongoing tasks on initial load
  useEffect(() => {
    ensureOneOngoingTask();
  }, []); // Empty dependency array means it only runs once on mount

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Get tasks from this day and other days
    const dateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();

    let updatedCurrentDayTasks = [...currentDayTasks];

    if (newStatus === 'ongoing') {
      // Pause any other ongoing tasks
      const ongoingTasks = updatedCurrentDayTasks.filter(t => t.status === 'ongoing' && t._id !== taskId);
      for (const task of ongoingTasks) {
        await updateTask(task._id, { status: 'paused' });
      }
      updatedCurrentDayTasks = updatedCurrentDayTasks.map(task =>
        task.status === 'ongoing' && task._id !== taskId
          ? { ...task, status: 'paused' }
          : task
      );
    }

    // Update the target task status
    await updateTask(taskId, { status: newStatus });

    // Update local tasks
    updatedCurrentDayTasks = updatedCurrentDayTasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    );

    // Reorder tasks based on status
    const reorderedTasks = updatedCurrentDayTasks.sort((a, b) => {
      if (a.status === 'ongoing') return -1;
      if (b.status === 'ongoing') return 1;
      if (a.status === 'paused' && b.status !== 'paused') return -1;
      if (b.status === 'paused' && a.status !== 'paused') return 1;
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (b.status === 'done' && a.status !== 'done') return -1;
      return a.order - b.order;
    });

    // Update task store
    const newTasksByDate = structuredClone(tasksByDate);
    newTasksByDate[dateKey] = reorderedTasks.map((task, index) => ({ ...task, order: index }));
    setTasks(newTasksByDate);

    // Update order in backend
    for (const task of reorderedTasks) {
      const newOrder = reorderedTasks.findIndex((t) => t._id === task._id);
      if (task.order !== newOrder) {
        await updateTask(task._id, { order: newOrder });
      }
    }
  };

  // Handle task resize
  const handleTaskResize = async (id: string, size: number) => {
    const task = currentDayTasks.find((t) => t._id === id);
    if (!task) return;

    const otherTasksMinutes = currentDayTasks
      .filter((t) => t._id !== id)
      .reduce((acc, t) => acc + t.size * 15, 0);

    const newTaskMinutes = size * 15;

    if (otherTasksMinutes + newTaskMinutes > dayCapacity * 60) {
      if (confirm('This exceeds your daily capacity. Move to another day?')) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        await updateTask(id, { size, duration: newTaskMinutes, scheduledAt: nextDay });
        return;
      }
    }

    await updateTask(id, { size, duration: newTaskMinutes });
  };

  // Create map of tasks by ID for easy lookup - including nested tasks
  const currentDayTasksById = useMemo(() => {
    const map: Record<string, Task> = {};

    // First, add all tasks to the map
    currentDayTasks.forEach(t => {
      map[t._id] = t;
    });

    return map;
  }, [currentDayTasks]);

  // Force cancel drag on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDragging) {
        cancelDrag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, cancelDrag]);

  // Handle mouse up to finalize task move
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (draggedTask) {
        if (dropIndicator) {
          // Apply the task move with the indicator position
          handleTaskMove();
        } else {
          // If dropped in an area without an indicator, just cancel the drag
          cancelDrag();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // We could add additional logic here if needed for global mouse tracking
      // This is useful for drag effects that need to follow the cursor
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, draggedTask, dropIndicator, handleTaskMove, cancelDrag]);

  return (
    <div className={`task-list ${isDragging ? 'is-dragging' : ''}`}>
      <div className="flex flex-col gap-4">
        {/* Filter out tasks that are subtasks (they'll be rendered by their parent group) */}
        {currentDayTasks
          .filter(task => !task.parentId)
          .map((task) => {
            // Use a unique key that includes subtask info for proper re-rendering
            const uniqueKey = `${task._id}-${task.subtasks?.length || 0}-${task.updatedAt?.getTime() || 0}`;

            return task.subtasks?.length > 0 ? (
              <TaskGroup
                key={uniqueKey}
                task={task}
                subtasks={task.subtasks}
                isEditMode={isEditMode}
                onDelete={deleteTask}
                onResize={handleTaskResize}
                onStatusChange={handleStatusChange}
                onLongPress={onLongPress}
                isDragging={isDragging}
                draggedTask={draggedTask}
                dropIndicator={dropIndicator}
                onStartDrag={startDrag}
                onShowIndicator={showIndicator}
              />
            ) : (
              <TaskItem
                key={`task-${task._id}`}
                task={task}
                isEditMode={isEditMode}
                onDelete={deleteTask}
                onResize={handleTaskResize}
                onStatusChange={handleStatusChange}
                onLongPress={onLongPress}
                isDragging={isDragging}
                isBeingDragged={draggedTask?._id === task._id}
                dropIndicator={dropIndicator}
                onStartDrag={startDrag}
                onShowIndicator={showIndicator}
              />
            );
          })}

        {/* Empty state with button to create task */}
        {currentDayTasks.length === 0 && !isEditMode && (
          <div className="alert alert-info flex flex-col items-center text-center p-4">
            <p>{t('taskList.emptyMessage')}</p>
            <button className="btn btn-primary mt-2" onClick={() => setIsEditMode(true)}>
              {t('taskList.createTask')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
