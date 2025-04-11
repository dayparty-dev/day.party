import { useMemo } from 'react';
import { useTaskStore } from '../_stores/useTaskStore';
import { isSameMonth, addMonths, subMonths } from 'date-fns';
import { Task } from '../_models/Task';

export const useTasks = () => {
  const isInitialized = useTaskStore(state => state.isInitialized);

  // Obtener tareas globales
  const tasksByDate = useTaskStore(state => state.tasksByDate);

  // Obtener tareas para el día seleccionado
  const currentDayTasks = useTaskStore(state => state.currentDayTasks);

  // Obtener la capacidad del día
  const dayCapacity = useTaskStore(state => state.dayCapacity);

  // Obtener la fecha actual
  const currentDate = useTaskStore(state => state.currentDate);

  // Obtener el total de minutos de las tareas
  const totalMinutes = useTaskStore(state => state.totalMinutes);

  // Inicialización del store
  const initialize = useTaskStore(state => state.initialize);

  // Actualizar fecha actual
  const setCurrentDate = useTaskStore(state => state.setCurrentDate);

  // Cambiar capacidad del día
  const setDayCapacity = useTaskStore(state => state.setDayCapacity);

  // Establecer todas las tareas
  const setTasks = useTaskStore(state => state.setTasks);

  // Agregar tarea
  const addTask = useTaskStore(state => state.addTask);
  
  // Actualizar tarea
  const updateTask = useTaskStore(state => state.updateTask);
  
  // Delete task
  const deleteTask = useTaskStore(state => state.deleteTask);

  // Delete all tasks for a specific day
  const deleteAllDayTasks = useTaskStore(state => state.deleteAllDayTasks);

  // Get tasks for a specific date
  const getTasksForDate = useTaskStore(state => state.getTasksForDate);
  
  // Establecer las tareas del día seleccionado
  const setCurrentDayTasks = useTaskStore(state => state.setCurrentDayTasks);

  // Calcular el total de minutos de las tareas
  const calculateTotalMinutes = useTaskStore(state => state.calculateTotalMinutes);

  const forceSync = useTaskStore(state => state.forceSync);

    // Helper function moved outside the hook order to avoid issues
  // This is now a regular function, not a hook
  const getDaysWithTasksInMonthRange = (
    month: Date,
    tasksByDateMap: Record<string, Task[]>
  ) => {
    // Get the previous, current, and next months
    const prevMonth = subMonths(month, 1);
    const nextMonth = addMonths(month, 1);

    // Create a map of dateKeys to true for dates with tasks in the specified month range
    const daysWithTasks = new Map<string, Date>();

    Object.entries(tasksByDateMap).forEach(([dateKeyStr, tasks]) => {
      if (tasks.length > 0) {
        // Convert the dateKey back to a Date
        const dateFromKey = new Date(parseInt(dateKeyStr));

        // Check if this date falls within the current, previous, or next month
        if (
          isSameMonth(dateFromKey, month) ||
          isSameMonth(dateFromKey, prevMonth) ||
          isSameMonth(dateFromKey, nextMonth)
        ) {
          daysWithTasks.set(dateKeyStr, dateFromKey);
        }
      }
    });

    return Array.from(daysWithTasks.values());
  };
 
  const getMemoizedDaysWithTasksInMonthRange = useMemo(() => {
    const cache = new Map<string, Date[]>();
    return (month: Date) => {
      console.log("isInitialized", isInitialized);
      console.log("tasksByDate", tasksByDate);
      // if (!isInitialized) return [];
  
      const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
      console.log("cache", cache);
      console.log("monthKey", monthKey);
      if (!cache.has(monthKey)) {
        console.log("Calculating days with tasks for month", monthKey);
        cache.set(monthKey, getDaysWithTasksInMonthRange(month, tasksByDate));
      }
  
      return cache.get(monthKey) || [];
    };
  }, [isInitialized, tasksByDate]);

  return {
    isInitialized,
    tasksByDate,
    currentDayTasks,
    dayCapacity,
    currentDate,
    totalMinutes,
    initialize,
    setCurrentDate,
    setDayCapacity,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    deleteAllDayTasks,
    getTasksForDate,
    setCurrentDayTasks,
    calculateTotalMinutes,
    getDaysWithTasksInMonth :getMemoizedDaysWithTasksInMonthRange,
    forceSync
  };
};
