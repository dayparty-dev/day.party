import type { Task } from './task.js';

export interface DayRundown {
  date: string;
  userId: string;
  tasks: Task[];
  capacity: number;
  completed: number;
}
