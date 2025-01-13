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

const isCloudSyncEnabled = true; // TODO: actually check if user has premium

export default function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data
  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    const initialTasks = stored
      ? JSON.parse(stored).sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];
    setTasks(initialTasks);
    setIsInitialized(true);

    // Then fetch from server if needed
    if (isCloudSyncEnabled) {
      fetchTasksServer().then((cloudTasks) => {
        if (cloudTasks.length > 0) {
          setTasks(cloudTasks.sort((a, b) => (a.order || 0) - (b.order || 0)));
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
    };
  }

  const mergeTasks = (localTasks: Task[], cloudTasks: Task[]) => {
    // Merge tasks and ensure they're sorted by order
    const mergedTasks = cloudTasks.length > 0 ? cloudTasks : localTasks;
    return mergedTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const addTask = async ({ title, size }: { title: string; size: number }) => {
    const currentDate = new Date();
    const maxOrder = Math.max(...tasks.map((t) => t.order || 0), -1);

    const task: Task = {
      title,
      size,
      status: 'pending',
      createdAt: currentDate,
      updatedAt: currentDate,
      dueDate: currentDate,
      _id: nanoid(),
      order: maxOrder + 1,
    };

    // Update local state and storage
    const updatedTasks = [...tasks, task].sort((a, b) => a.order - b.order);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));

    if (isCloudSyncEnabled) {
      await addTaskServer(task);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Don't update local state if it's just an order update
    // (since we already did it in handleDragEnd)
    if (!('order' in updates)) {
      const updatedTasks = tasks.map((task) =>
        task._id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      );

      const sortedTasks = updatedTasks.sort((a, b) => a.order - b.order);
      setTasks(sortedTasks);
      localStorage.setItem('tasks', JSON.stringify(sortedTasks));
    } else {
      // For order updates, just update localStorage
      const updatedTasks = tasks.map((task) =>
        task._id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      );
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }

    if (isCloudSyncEnabled) {
      await updateTaskServer(id, updates);
    }
  };

  const deleteTask = async (id: string) => {
    // Update local state and storage
    const updatedTasks = tasks.filter((task) => task._id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));

    if (isCloudSyncEnabled) {
      await deleteTaskServer(id);
    }
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setTasks,
  };
}
