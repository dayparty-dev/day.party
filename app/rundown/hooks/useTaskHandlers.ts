import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { TaskStatus, Task } from '../../_models/Task';

export function useTaskHandlers({ tasks, setTasks, updateTask, currentDate, setCurrentDate, currentDayTasks, dayCapacity }) {
  
  /**
   * Handles drag end event for task reordering
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = currentDayTasks.findIndex(
          (task) => task._id === active.id
        );
        const newIndex = currentDayTasks.findIndex(
          (task) => task._id === over.id
        );

        // Create new array with the moved item
        const newDayTasks = arrayMove(currentDayTasks, oldIndex, newIndex);

        // Update all tasks while preserving tasks from other days
        const otherTasks = tasks.filter(
          (task) =>
            new Date(task.scheduledAt).toDateString() !==
            currentDate.toDateString()
        );

        const updatedTasks = [
          ...otherTasks,
          ...newDayTasks.map((task:Task, index) => ({
            ...task,
            order: index,
          })),
        ];

        // First update the local state immediately for UI responsiveness
        setTasks(updatedTasks);

        // Then update the backend
        newDayTasks.forEach((task:Task, index) => {
          updateTask(task._id, { ...task, order: index });
        });
      }
    },
    [tasks, setTasks, updateTask, currentDate, currentDayTasks]
  );

    /**
   * Handles status change for a task
   */
    const handleStatusChange = useCallback(
      async (taskId: string, newStatus: TaskStatus) => {
        const otherDayTasks = tasks.filter(
          (task) =>
            new Date(task.scheduledAt).toDateString() !==
            currentDate.toDateString()
        );
  
        // First, update all tasks that need to be changed
        let updatedCurrentDayTasks = [...currentDayTasks];
  
        // If setting a task to ongoing, pause any currently ongoing task first
        if (newStatus === 'ongoing') {
          // Find and pause any ongoing tasks
          const ongoingTasks = updatedCurrentDayTasks.filter(
            (task) => task.status === 'ongoing' && task._id !== taskId
          );
  
          // Update backend first for ongoing tasks
          for (const task of ongoingTasks) {
            await updateTask(task._id, { status: 'paused' });
          }
  
          // Update local state for ongoing tasks
          updatedCurrentDayTasks = updatedCurrentDayTasks.map((task) =>
            task.status === 'ongoing' && task._id !== taskId
              ? { ...task, status: 'paused' as TaskStatus }
              : task
          );
        }
  
        // Then update the target task in backend
        await updateTask(taskId, { status: newStatus });
  
        // Update the target task in local state
        updatedCurrentDayTasks = updatedCurrentDayTasks.map((task) =>
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
  
        // Update orders and set tasks
        const updatedTasks = [
          ...otherDayTasks,
          ...reorderedTasks.map((task, index) => ({
            ...task,
            order: index,
          })),
        ];
  
        // Update local state
        setTasks(updatedTasks);
  
        // Update orders in backend
        for (const task of reorderedTasks) {
          const newOrder = reorderedTasks.findIndex((t) => t._id === task._id);
          if (task.order !== newOrder) {
            await updateTask(task._id, { order: newOrder });
          }
        }
      },
      [tasks, setTasks, updateTask, currentDate, currentDayTasks]
    );

      /**
   * Handles task resizing
   */
  const handleTaskResize = useCallback(
    (id, size) => {
      const task = tasks.find((t) => t._id === id);
      const otherTasksMinutes = currentDayTasks
        .filter((t) => t._id !== id)
        .reduce((acc, t) => acc + t.size * 15, 0);
      const newTaskMinutes = size * 15;

      if (otherTasksMinutes + newTaskMinutes > dayCapacity * 60) {
        if (
          confirm('This will exceed your daily capacity. Move to next day?')
        ) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          updateTask(id, { size, scheduledAt: nextDay });
          setCurrentDate(nextDay);
        }
        return;
      }
      updateTask(id, { size });
    },
    [tasks, updateTask, currentDate, dayCapacity, currentDayTasks]
  );

    /**
   * Handles task completion and moves to the next task
   * Not used 
   */
  // const handleTaskFinish = useCallback(async () => {
  //   if (isFinishing) return; // ignore subsequent clicks
  //   setIsFinishing(true);

  //   if (!currentTask) {
  //     setIsFinishing(false);
  //     return;
  //   }

  //   try {
  //     await updateTask(currentTask._id, { status: 'done' });

  //     if (nextTask) {
  //       await updateTask(
  //         nextTask._id,
  //         { status: 'ongoing' },
  //         { disableAutoPause: true }
  //       );
  //     }
  //   } finally {
  //     setIsFinishing(false);
  //   }
  // }, [currentTask, nextTask, updateTask, isFinishing]);


  return { handleDragEnd, handleStatusChange, handleTaskResize };
}