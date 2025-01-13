export interface Task {
  _id: string;
  title: string;
  size: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  order: number;
}

export type TaskStatus = 'ongoing' | 'paused' | 'pending' | 'done';
