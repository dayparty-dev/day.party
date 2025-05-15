import { Task } from 'app/_models/Task';
import { useTaskStore } from 'app/_stores/useTaskStore';
import { useCallback, useState } from 'react';

export type DropIndicator = {
  targetId: string;
  position: 'before' | 'after' | 'inside';
};

export function useTaskIndicators() {
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [lastHoveredId, setLastHoveredId] = useState<string | null>(null);

  const tasksByDate = useTaskStore((s) => s.tasksByDate);
  const setTasks = useTaskStore((s) => s.setTasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const currentDate = useTaskStore((s) => s.currentDate);
  const currentDayTasks = useTaskStore((s) => s.currentDayTasks);

  const startDrag = useCallback((task: Task, e?: React.MouseEvent) => {
    setDraggedTask(task);

    // Store initial drag position if available
    if (e) {
      setDragStartPosition({ x: e.clientX, y: e.clientY });
    } else {
      setDragStartPosition(null);
    }

    // Add dragging class to body for global styling
    document.body.classList.add('is-dragging-task');
  }, []);

  const cancelDrag = useCallback(() => {
    setDraggedTask(null);
    setDropIndicator(null);
    setDragStartPosition(null);
    setLastHoveredId(null);

    // Remove any lingering opacity states from dragged elements
    const fadedElements = document.querySelectorAll('.opacity-50');
    fadedElements.forEach((el) => {
      el.classList.remove('opacity-50');
    });

    // Remove dragging class
    document.body.classList.remove('is-dragging-task');
  }, []);

  const showIndicator = useCallback(
    (targetId: string, position: 'before' | 'after' | 'inside') => {
      // Skip if we're hovering on the same element with the same position
      if (dropIndicator?.targetId === targetId && dropIndicator?.position === position) {
        return;
      }

      // Store the last hovered ID to improve animation transitions
      setLastHoveredId(targetId);

      // Set the new indicator
      setDropIndicator({ targetId, position });
    },
    [dropIndicator],
  );

  const handleTaskMove = useCallback(async () => {
    if (!draggedTask || !dropIndicator) return;

    const { targetId, position } = dropIndicator;
    const sourceId = draggedTask._id;

    if (sourceId === targetId) {
      cancelDrag();
      return;
    }

    const currentDateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
    let tasksCopy = JSON.parse(JSON.stringify(currentDayTasks)); // Deep clone to avoid reference issues

    // Find source and target task
    let sourceTask: Task | null = null;
    let sourceTaskParent: Task | null = null;

    // First, check if source task is in the main task list
    sourceTask = tasksCopy.find((t) => t._id === sourceId);

    // If not found in main list, search within subtasks of all task groups
    if (!sourceTask) {
      for (const parentTask of tasksCopy) {
        if (parentTask.subtasks) {
          const subtask = parentTask.subtasks.find((sub) => sub._id === sourceId);
          if (subtask) {
            sourceTask = JSON.parse(JSON.stringify(subtask)); // Deep clone
            sourceTaskParent = parentTask;
            break;
          }
        }
      }
    }

    const targetTask = tasksCopy.find((t) => t._id === targetId);

    if (!sourceTask || !targetTask) {
      cancelDrag();
      return;
    }

    // Additional safety check - prevent circular references
    if (sourceTask.subtasks?.some((sub) => sub._id === targetId)) {
      console.warn('Cannot move a task inside its own subtask');
      cancelDrag();
      return;
    }

    try {
      // Handle nesting - moving a task inside another to make it a subtask
      if (position === 'inside') {
        // Skip if trying to move a task inside itself
        if (sourceId === targetId) {
          cancelDrag();
          return;
        }

        // If source is already in a group, remove it from its current parent
        if (sourceTaskParent) {
          // Remove from parent's subtasks array
          const updatedSubtasks = sourceTaskParent.subtasks.filter((task) => task._id !== sourceId);

          // Update parent in backend
          await updateTask(sourceTaskParent._id, {
            subtasks: updatedSubtasks,
            isGroup: updatedSubtasks.length > 0 ? sourceTaskParent.isGroup : false,
          });

          // Update parent in local state
          tasksCopy = tasksCopy.map((t) => {
            if (t._id === sourceTaskParent._id) {
              return {
                ...t,
                subtasks: updatedSubtasks,
                isGroup: updatedSubtasks.length > 0 ? t.isGroup : false,
              };
            }
            return t;
          });
        } else if (sourceTask.parentId) {
          // This is a fallback for cases where parentId exists but sourceTaskParent wasn't found
          const currentParent = tasksCopy.find((t) => t._id === sourceTask.parentId);
          if (currentParent && currentParent.subtasks) {
            const updatedSubtasks = currentParent.subtasks.filter((task) => task._id !== sourceId);

            await updateTask(currentParent._id, {
              subtasks: updatedSubtasks,
              isGroup: updatedSubtasks.length > 0 ? currentParent.isGroup : false,
            });

            tasksCopy = tasksCopy.map((t) => {
              if (t._id === currentParent._id) {
                return {
                  ...t,
                  subtasks: updatedSubtasks,
                  isGroup: updatedSubtasks.length > 0 ? t.isGroup : false,
                };
              }
              return t;
            });
          }
        }

        // Add task as a subtask to the target
        const targetSubtasks = targetTask.subtasks || [];

        // Prevent duplicates in subtasks array
        if (!targetSubtasks.some((task) => task._id === sourceId)) {
          // Create a clean copy of source task with parentId set to target
          const sourceTaskCopy = {
            ...sourceTask,
            parentId: targetId,
          };

          const newSubtasks = [...targetSubtasks, sourceTaskCopy];

          // Update target in backend
          await updateTask(targetId, {
            isGroup: true,
            subtasks: newSubtasks,
          });

          // Update source task in backend to point to its new parent
          await updateTask(sourceId, { parentId: targetId });

          // Update local state
          let updatedTasks = tasksCopy;

          // If the source was in the main list (not a subtask), remove it
          if (!sourceTaskParent) {
            updatedTasks = updatedTasks.filter((t) => t._id !== sourceId);
          }

          // Update target task with new subtasks
          updatedTasks = updatedTasks.map((t) => {
            if (t._id === targetId) {
              return {
                ...t,
                isGroup: true,
                subtasks: newSubtasks,
              };
            }
            return t;
          });

          // Update task store
          const newTasksByDate = { ...tasksByDate };
          newTasksByDate[currentDateKey] = updatedTasks;
          setTasks(newTasksByDate);
        }
      }
      // Handle reordering (before/after) - moving tasks to main list
      else {
        let sourceIndex = -1;
        let targetIndex = tasksCopy.findIndex((t) => t._id === targetId);

        // If source is not already in the main list (it's a subtask)
        if (sourceTaskParent) {
          // 1. Remove from parent's subtasks
          const updatedSubtasks = sourceTaskParent.subtasks.filter((task) => task._id !== sourceId);

          // 2. Update parent in backend
          await updateTask(sourceTaskParent._id, {
            subtasks: updatedSubtasks,
            isGroup: updatedSubtasks.length > 0 ? sourceTaskParent.isGroup : false,
          });

          // 3. Update parent in local state
          tasksCopy = tasksCopy.map((t) => {
            if (t._id === sourceTaskParent._id) {
              return {
                ...t,
                subtasks: updatedSubtasks,
                isGroup: updatedSubtasks.length > 0 ? t.isGroup : false,
              };
            }
            return t;
          });

          // 4. Clear the source task's parentId in backend
          await updateTask(sourceId, { parentId: undefined });

          // 5. Create a cleaned version of the task to add to main list
          const updatedSourceTask = {
            ...sourceTask,
            parentId: undefined,
          };

          // Source isn't in main list yet
          sourceIndex = -1;

          // Add task to the main task list
          tasksCopy.push(updatedSourceTask);
        } else {
          // Task is already in main list, find its index
          sourceIndex = tasksCopy.findIndex((t) => t._id === sourceId);
        }

        // Adjust target index for "after" position
        if (position === 'after') {
          targetIndex += 1;
        }

        // Account for source removal if it was in the list
        if (sourceIndex !== -1 && sourceIndex < targetIndex) {
          targetIndex--;
        }

        // Create new tasks array with source moved to target position
        const newTasks = [...tasksCopy];
        if (sourceIndex !== -1) {
          newTasks.splice(sourceIndex, 1);
        }

        // Insert the task at the target position
        newTasks.splice(targetIndex, 0, {
          ...sourceTask,
          parentId: undefined,
        });

        // Update order for all tasks
        const updatedTasks = newTasks.map((task, idx) => ({
          ...task,
          order: idx,
        }));

        // Update task store
        const newTasksByDate = { ...tasksByDate };
        newTasksByDate[currentDateKey] = updatedTasks;
        setTasks(newTasksByDate);

        // Update backend with new orders
        for (const task of updatedTasks) {
          const newOrder = updatedTasks.findIndex((t) => t._id === task._id);
          if (task.order !== newOrder || task._id === sourceId) {
            await updateTask(task._id, {
              order: newOrder,
              ...(task._id === sourceId ? { parentId: undefined } : {}),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error moving task:', error);
    } finally {
      // Always clean up, even if there's an error
      setTimeout(() => {
        // Allow any state updates to complete before cleaning up
        cancelDrag();
      }, 100);
    }
  }, [draggedTask, dropIndicator, currentDayTasks, tasksByDate, currentDate, setTasks, updateTask, cancelDrag]);

  return {
    dropIndicator,
    draggedTask,
    startDrag,
    cancelDrag,
    showIndicator,
    handleTaskMove,
  };
}
