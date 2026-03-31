export interface Task {
  id: string;
  userId: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  tagKey?: string;
  isComplete: boolean;
  scheduledDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
