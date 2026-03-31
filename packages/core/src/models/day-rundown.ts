import type { Task } from './task';

export interface DayRundown {
  date: string;
  userId: string;
  tasks: Task[];
  capacity: number;
  completed: number;
}
