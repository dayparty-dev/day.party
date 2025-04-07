'use server';

import { Task } from 'app/_models/Task';
import { AuthContext, withAuth } from 'app/auth/_middleware/withAuth';
import { getCollection } from 'lib/mongodb';

// Fetch only tasks belonging to the current user
export const fetchTasksServer = withAuth(async (ctx: AuthContext) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const tasksCollection = await getCollection<Task>('tasks');
  return await tasksCollection.find({ userId }).toArray();
});

// Add a new task with the current user's ID
export const addTaskServer = withAuth(async (ctx: AuthContext, task: Task) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Make sure the task is associated with the current user
  const taskWithUserId = {
    ...task,
    userId,
  };

  const tasksCollection = await getCollection<Task>('tasks');
  await tasksCollection.insertOne(taskWithUserId);
  return taskWithUserId;
});

// Update a task, ensuring it belongs to the current user
export const updateTaskServer = withAuth(async (ctx: AuthContext, id: string, updates: Partial<Task>) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const tasksCollection = await getCollection<Task>('tasks');

  // Only update if task belongs to current user
  await tasksCollection.updateOne({ _id: id, userId }, { $set: { ...updates, updatedAt: new Date() } });
});

// Delete a task, ensuring it belongs to the current user
export const deleteTaskServer = withAuth(async (ctx: AuthContext, id: string) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const tasksCollection = await getCollection<Task>('tasks');

  // Only delete if task belongs to current user
  await tasksCollection.deleteOne({ _id: id, userId });
});

// Delete several tasks, ensuring they belong to the current user
export const deleteAllDayTasksServer = withAuth(async (ctx: AuthContext, dayToDelete: Date) => {
  const { userId } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const tasksCollection = await getCollection<Task>('tasks');

  const normalizedScheduledAt = new Date(dayToDelete);

  normalizedScheduledAt.setHours(0, 0, 0, 0);

  await tasksCollection.deleteMany({
    scheduledAt: normalizedScheduledAt,
    userId,
  });
});
