import { Task } from '../_models/Task';

const getDateKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime().toString();
  };
  
  export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
    return tasks.reduce((acc, task) => {
      const dateKey = getDateKey(new Date(task.scheduledAt));
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }

export function loadTasksFromStorage(): Task[] {
  const raw = localStorage.getItem('TASKS');
  return raw ? JSON.parse(raw) : [];
}
