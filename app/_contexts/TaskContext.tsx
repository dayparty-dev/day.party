import { createContext, useContext, useState } from 'react';
import useTasks from '../_hooks/useTasks';
import { Task } from 'app/_models/Task';

interface TaskContextType {
  tasks: Task[];
  totalMinutes: number;
  addTask: (task: { title: string; size: number; scheduledAt?: Date }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>, options?: { disableAutoPause?: boolean }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  dayCapacity: number;
  setDayCapacity: (capacity: number) => void;
  currentDayTasks: Task[];
}


const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }) {
  const { tasks, addTask, updateTask, deleteTask, setTasks, getTasksForDate } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayCapacity, setDayCapacity] = useState(8); // 8 hours default
  const currentDayTasks = getTasksForDate(currentDate);
  const totalMinutes = currentDayTasks.reduce((acc, task) => acc + task.size * 15, 0);
  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        setTasks,
        currentDate,
        setCurrentDate,
        dayCapacity,
        setDayCapacity,
        currentDayTasks,
        totalMinutes,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext debe usarse dentro de un TaskProvider");
  }
  return context;
}