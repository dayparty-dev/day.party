import { useState, useMemo, useEffect } from 'react';
import useTasks from 'app/_hooks/useTasks';

export default function useTaskManager() {
  const { tasks, addTask, updateTask, deleteTask, setTasks, getTasksForDate } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayCapacity, setDayCapacity] = useState(8); // 8 hours default
  const currentDayTasks = useMemo(() => getTasksForDate(currentDate), [getTasksForDate, currentDate, tasks]);
  const totalMinutes = useMemo(() => currentDayTasks.reduce((acc, task) => acc + task.size * 15, 0), [currentDayTasks]);

  useEffect(() => {
    ensureOneOngoingTask();
  }, []);

  const ensureOneOngoingTask = async () => {
    const ongoingTasks = currentDayTasks.filter((task) => task.status === 'ongoing');
    if (ongoingTasks.length > 1) {
      const sortedOngoing = [...ongoingTasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const [keepOngoing, ...othersOngoing] = sortedOngoing;

      for (const task of othersOngoing) {
        await updateTask(task._id, { status: 'paused' });
      }

      const updatedTasks = tasks.map((task) =>
        othersOngoing.some((t) => t._id === task._id) ? { ...task, status: 'paused' } : task
      );

      setTasks(updatedTasks);
    }
  };

  return {
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
  };
}
