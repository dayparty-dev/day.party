import { useEffect, useMemo } from 'react';
import { TaskStatus } from '../../_models/Task';

export function useTaskUtils({ tasks, setTasks, updateTask, currentDayTasks }) {

//   useEffect(() => {
//     ensureOneOngoingTask();
//   }, []);

  /**
   * Ensures only one task is in the ongoing state
   */
  const ensureOneOngoingTask = async () => {
    const ongoingTasks = currentDayTasks.filter(
      (task) => task.status === 'ongoing'
    );

    if (ongoingTasks.length > 1) {
      // Keep the most recently updated ongoing task
      const sortedOngoing = [...ongoingTasks].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const [keepOngoing, ...othersOngoing] = sortedOngoing;

      // Pause all other ongoing tasks
      for (const task of othersOngoing) {
        await updateTask(task._id, { status: 'paused' });
      }

      // Update local state
      const updatedTasks = tasks.map((task) =>
        othersOngoing.some((t) => t._id === task._id)
          ? { ...task, status: 'paused' as TaskStatus }
          : task
      );

      setTasks(updatedTasks);
    }
  };

  return { ensureOneOngoingTask };
}
