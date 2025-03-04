export interface Task {
  _id: string;
  title: string;
  size: number;
  duration: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate: Date;
  order: number;
}

export type TaskStatus = 'ongoing' | 'paused' | 'pending' | 'done';
