'use client';

import { useState, useEffect } from 'react';
import { Task } from 'models/Task';
import {
  addTaskServer,
  updateTaskServer,
  deleteTaskServer,
  fetchTasksServer,
} from '../_actions/tasks';
import { nanoid } from 'nanoid';

const isCloudSyncEnabled = !!process.env.MONGODB_URI;

const getDateKey = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime().toString();
};

const loadTasksFromStorage = () => {
  const stored = localStorage.getItem('tasks');
  if (!stored) return {};

  try {
    return JSON.parse(stored);
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
            const dateKey = getDateKey(task.scheduledDate);
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
    };
  }

  const addTask = async ({
    title,
    size,
    scheduledDate,
  }: {
    title: string;
    size: number;
    scheduledDate?: Date;
  }) => {
    const currentDate = new Date();
    const normalizedScheduledDate = scheduledDate
      ? new Date(scheduledDate)
      : new Date();
    normalizedScheduledDate.setHours(0, 0, 0, 0);

    const dateKey = getDateKey(normalizedScheduledDate);
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
      scheduledDate: normalizedScheduledDate,
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
      const updatedTasksByDate = JSON.parse(
        JSON.stringify(prevTasksByDate)
      ) as typeof prevTasksByDate;

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
        const dateKey = getDateKey(task.scheduledDate);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      setTasksByDate(grouped);
      saveTasksToStorage(grouped);
    },
    getTasksForDate,
  };
}
