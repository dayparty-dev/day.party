'use server';

import { getCollection } from 'lib/mongodb';
import { Task } from 'app/_models/Task';

export async function fetchTasksServer() {
  const tasksCollection = await getCollection<Task>('tasks');

  return await tasksCollection.find({}).toArray();
}

export async function addTaskServer(task: Task) {
  const tasksCollection = await getCollection<Task>('tasks');

  await tasksCollection.insertOne(task);
  return task;
}

export async function updateTaskServer(id: string, updates: Partial<Task>) {
  const tasksCollection = await getCollection<Task>('tasks');

  await tasksCollection.updateOne(
    { _id: id },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}

export async function deleteTaskServer(id: string) {
  const tasksCollection = await getCollection<Task>('tasks');

  await tasksCollection.deleteOne({ _id: id });
}
