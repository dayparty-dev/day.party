export interface Task {
  _id: string;
  title: string;
  size: number;
  tagKey?: string;
  
  duration: number;
  elapsed: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date;
  order: number;
  userId: string;
  
  deletedAt?: Date;
  isSynced?: boolean;
  lastSyncedAt?: Date;
  isDirty?: boolean;
}

export type TaskStatus = 'ongoing' | 'paused' | 'pending' | 'done';
