'use client';

import { useState, useEffect, useMemo } from 'react';
import { Task } from 'app/_models/Task';
import {
  addTaskServer,
  updateTaskServer,
  deleteTaskServer,
  fetchTasksServer,
} from '../_actions/tasks';
import { nanoid } from 'nanoid';
import {
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';

const isCloudSyncEnabled = false;
// process.env.NEXT_PUBLIC_IS_CLOUD_SYNC_ENABLED === 'true';

const getDateKey = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime().toString();
};

const loadTasksFromStorage = () => {
  const stored = localStorage.getItem('tasks');
  if (!stored) return {};

  try {
    const tasks = JSON.parse(stored, (key, value) =>
      // FIXME: find better way to store complex values (i.e. Date) in JSON
      key.endsWith('At') ? new Date(value) : value
    );

    return tasks;
  } catch (e) {
    console.error('Failed to parse tasks from localStorage:', e);
    return {};
  }
};

const saveTasksToStorage = (tasksByDate: Record<string, Task[]>) => {
  localStorage.setItem('tasks', JSON.stringify(tasksByDate));
};

export default function useTasks() {
  // Store tasks grouped by date
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the getDaysWithTasksInMonth function to avoid redundant calculations
  // IMPORTANT: Always declare hooks at the top level to maintain consistent hook order
  const getMemoizedDaysWithTasksInMonthRange = useMemo(() => {
    // Create a cache to store the results for each month
    const cache = new Map<string, Date[]>();

    return (month: Date) => {
      if (!isInitialized) return [];

      const monthKey = month.getFullYear() + '-' + month.getMonth();

      if (!cache.has(monthKey)) {
        cache.set(monthKey, getDaysWithTasksInMonthRange(month, tasksByDate));
      }

      return cache.get(monthKey) || [];
    };
  }, [isInitialized, tasksByDate]); // Recalculate when initialized state or tasksByDate changes

  // Load initial data
  useEffect(() => {
    const storedTasks = loadTasksFromStorage();
    setTasksByDate(storedTasks);
    setIsInitialized(true);

    // Then fetch from server if needed
    if (isCloudSyncEnabled) {
      fetchTasksServer().then((cloudTasks) => {
        if (cloudTasks.length > 0) {
          // Group cloud tasks by date
          const groupedTasks = cloudTasks.reduce((acc, task) => {
            const dateKey = getDateKey(task.scheduledAt);
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(task);
            return acc;
          }, {} as Record<string, Task[]>);

          // Sort tasks within each date
          Object.values(groupedTasks).forEach((dateTasks) => {
            dateTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
          });

          setTasksByDate(groupedTasks);
          saveTasksToStorage(groupedTasks);
        }
      });
    }
  }, []);

  // Don't render anything until we've initialized from localStorage
  if (!isInitialized) {
    return {
      tasks: [],
      addTask: () => Promise.resolve(),
      updateTask: () => Promise.resolve(),
      deleteTask: () => Promise.resolve(),
      setTasks: () => {},
      getTasksForDate: () => [],
      getDaysWithTasksInMonth: () => [],
    };
  }

  const addTask = async ({
    title,
    size,
    scheduledAt,
  }: {
    title: string;
    size: number;
    scheduledAt?: Date;
  }) => {
    const currentDate = new Date();
    const normalizedscheduledAt = scheduledAt
      ? new Date(scheduledAt)
      : new Date();
    normalizedscheduledAt.setHours(0, 0, 0, 0);

    const dateKey = getDateKey(normalizedscheduledAt);
    const dateTasks = tasksByDate[dateKey] || [];
    const maxOrder =
      dateTasks.length > 0
        ? Math.max(...dateTasks.map((t) => t.order || 0))
        : -1;

    const task: Task = {
      title,
      size,
      status: 'pending',
      duration: size * 15,
      createdAt: currentDate,
      updatedAt: currentDate,
      scheduledAt: normalizedscheduledAt,
      _id: nanoid(),
      order: maxOrder + 1,
    };

    const updatedDateTasks = [...dateTasks, task].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const updatedTasksByDate = {
      ...tasksByDate,
      [dateKey]: updatedDateTasks,
    };

    setTasksByDate(updatedTasksByDate);
    saveTasksToStorage(updatedTasksByDate);

    if (isCloudSyncEnabled) {
      await addTaskServer(task);
    }
  };

  const updateTask = async (
    id: string,
    updates: Partial<Task>,
    options: { disableAutoPause?: boolean } = {}
  ) => {
    setTasksByDate((prevTasksByDate) => {
      // Deep clone the state to avoid any mutation issues
      const updatedTasksByDate = structuredClone(prevTasksByDate);

      // Find the task and its date
      let targetDateKey: string | null = null;
      let targetTask: Task | null = null;

      // Find the task
      for (const [dateKey, dateTasks] of Object.entries(updatedTasksByDate)) {
        const task = dateTasks.find((t) => t._id === id);
        if (task) {
          targetDateKey = dateKey;
          targetTask = task;
          break;
        }
      }

      if (!targetDateKey || !targetTask) return prevTasksByDate;

      const dateTasks = updatedTasksByDate[targetDateKey];

      // If this is a status update
      if ('status' in updates) {
        // For updates setting to "ongoing", run auto-pause logic only if not disabled
        if (updates.status === 'ongoing' && !options.disableAutoPause) {
          dateTasks.forEach((task) => {
            if (task._id !== id && task.status === 'ongoing') {
              task.status = 'paused';
              task.updatedAt = new Date();
            }
          });
        }

        // Update the target task
        const taskToUpdate = dateTasks.find((t) => t._id === id);
        if (taskToUpdate) {
          Object.assign(taskToUpdate, {
            ...updates,
            updatedAt: new Date(),
          });
        }

        // Sort tasks based on status
        dateTasks.sort((a, b) => {
          if (a.status === 'ongoing') return -1;
          if (b.status === 'ongoing') return 1;
          if (a.status === 'paused' && b.status !== 'paused') return -1;
          if (b.status === 'paused' && a.status !== 'paused') return 1;
          if (a.status === 'done' && b.status !== 'done') return 1;
          if (b.status === 'done' && a.status !== 'done') return -1;
          return (a.order || 0) - (b.order || 0);
        });

        // Update orders after sorting
        dateTasks.forEach((task, index) => {
          task.order = index;
        });
      } else {
        // For non-status updates, just update the task
        const taskToUpdate = dateTasks.find((t) => t._id === id);
        if (taskToUpdate) {
          Object.assign(taskToUpdate, {
            ...updates,
            updatedAt: new Date(),
          });
        }
      }

      // Save to storage
      saveTasksToStorage(updatedTasksByDate);

      // Return new state
      return updatedTasksByDate;
    });

    // Update server if needed
    if (isCloudSyncEnabled) {
      await updateTaskServer(id, updates);
    }
  };

  const deleteTask = async (id: string) => {
    const updatedTasksByDate = { ...tasksByDate };
    let found = false;

    for (const dateKey of Object.keys(updatedTasksByDate)) {
      const dateTasks = updatedTasksByDate[dateKey];
      const taskIndex = dateTasks.findIndex((t) => t._id === id);

      if (taskIndex !== -1) {
        updatedTasksByDate[dateKey] = dateTasks.filter((t) => t._id !== id);
        found = true;
        break;
      }
    }

    if (!found) return;

    setTasksByDate(updatedTasksByDate);
    saveTasksToStorage(updatedTasksByDate);

    if (isCloudSyncEnabled) {
      await deleteTaskServer(id);
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return tasksByDate[dateKey] || [];
  };

  // Helper function moved outside the hook order to avoid issues
  // This is now a regular function, not a hook
  const getDaysWithTasksInMonthRange = (
    month: Date,
    tasksByDateMap: Record<string, Task[]>
  ) => {
    // Get the previous, current, and next months
    const prevMonth = subMonths(month, 1);
    const nextMonth = addMonths(month, 1);

    // Create a map of dateKeys to true for dates with tasks in the specified month range
    const daysWithTasks = new Map<string, Date>();

    Object.entries(tasksByDateMap).forEach(([dateKeyStr, tasks]) => {
      if (tasks.length > 0) {
        // Convert the dateKey back to a Date
        const dateFromKey = new Date(parseInt(dateKeyStr));

        // Check if this date falls within the current, previous, or next month
        if (
          isSameMonth(dateFromKey, month) ||
          isSameMonth(dateFromKey, prevMonth) ||
          isSameMonth(dateFromKey, nextMonth)
        ) {
          daysWithTasks.set(dateKeyStr, dateFromKey);
        }
      }
    });

    return Array.from(daysWithTasks.values());
  };

  // Flatten tasks for compatibility with existing code
  const allTasks = Object.values(tasksByDate).flat();

  return {
    tasks: allTasks,
    addTask,
    updateTask,
    deleteTask,
    setTasks: (newTasks: Task[]) => {
      // Group tasks by date when setting them
      const grouped = newTasks.reduce((acc, task) => {
        const dateKey = getDateKey(task.scheduledAt);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      setTasksByDate(grouped);
      saveTasksToStorage(grouped);
    },
    getTasksForDate,
    getDaysWithTasksInMonth: getMemoizedDaysWithTasksInMonthRange,
  };
}
