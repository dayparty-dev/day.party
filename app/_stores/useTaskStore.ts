import { addTaskServer, fetchTasksServer, syncTasksToServer } from 'app/_actions/tasks';
import { Task } from 'app/_models/Task';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
// import { useAuth } from 'app/auth/_hooks/useAuth';

//TODO DONDE COÑO VA ESTO?
type DragOverTarget = {
  type: 'task' | 'group';
  id: string;
} | null;

interface State {
  tasksByDate: Record<string, Task[]>;
  deletedTasks: { [taskId: string]: Task };
  currentDate: Date;
  dayCapacity: number; // capacidad por día (en horas)
  isInitialized: boolean;
  currentDayTasks: Task[];
  totalMinutes: number;
  dragOverTarget: DragOverTarget;

  hoverTarget: DragOverTarget;
  hoverStartTime: number;
}

interface Actions {
  initialize: () => Promise<void>;
  setCurrentDate: (date: Date) => void;
  setDayCapacity: (capacity: number) => void;
  setTasks: (tasks: Record<string, Task[]>) => void;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>, options?: { disableAutoPause?: boolean }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteAllDayTasks: (dayToDelete: Date) => Promise<void>;
  getTasksForDate: (date: Date) => Task[];
  setCurrentDayTasks: () => void;
  calculateTotalMinutes: () => void;
  syncTasks: () => Promise<void>;
  setDragOverTarget: (target: DragOverTarget) => void;
  setHoverTarget: (target: DragOverTarget | null) => void;
}

interface Selectors {
  isReadyToGroup: () => boolean;
}

export const useTaskStore = create<State & Actions & Selectors>()(
  devtools(
    persist(
      (set, get) => {
        // const { user } = useAuth(); // aún puedes usar hooks de React si lo sacas a parte
        const isCloudSyncEnabled = process.env.NEXT_PUBLIC_IS_CLOUD_SYNC_ENABLED === 'true';

        const getDateKey = (date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime().toString();
        };

        return {
          // STATES
          tasksByDate: {},
          deletedTasks: {},
          currentDate: new Date(),
          dayCapacity: 8, // capacidad por día, por ejemplo 8 horas
          isInitialized: false,
          currentDayTasks: [],
          totalMinutes: 0,
          dragOverTarget: null,

          hoverTarget: null,
          hoverStartTime: null,

          // ACTIONS
          initialize: async () => {
            const stored = localStorage.getItem('tasks');
            let tasks: Record<string, Task[]> = {};

            if (stored) {
              try {
                tasks = JSON.parse(stored, (key, value) => (key.endsWith('At') ? new Date(value) : value));

                // Migrate existing data: convert subtasks from string IDs to Task objects
                for (const dateKey in tasks) {
                  const dateTasks = tasks[dateKey];

                  // First create a mapping of all tasks by ID for this date
                  const taskById: Record<string, Task> = {};
                  dateTasks.forEach((task) => {
                    taskById[task._id] = task;
                  });

                  // Then convert subtasks from IDs to full objects
                  dateTasks.forEach((task) => {
                    if (task.subtasks && Array.isArray(task.subtasks)) {
                      // Check if subtasks are already objects by checking if the first item has an _id property
                      const isAlreadyObjects = task.subtasks.length > 0 && typeof task.subtasks[0] === 'object';

                      if (!isAlreadyObjects) {
                        // Convert string IDs to task objects
                        const subtaskIds = task.subtasks as unknown as string[];
                        task.subtasks = subtaskIds.map((id) => taskById[id]).filter(Boolean); // Filter out any undefined values
                      }
                    }
                  });
                }

                localStorage.setItem('tasks', JSON.stringify(tasks));
              } catch (e) {
                console.error('❌ Error parsing local tasks:', e);
              }
            }

            set({ tasksByDate: tasks, isInitialized: true });

            if (!isCloudSyncEnabled) return;

            try {
              const allLocalTasks = Object.values(tasks).flat();
              const dirtyTasks = allLocalTasks.filter((t) => t.isDirty);
              if (dirtyTasks.length > 0) {
                await syncTasksToServer(dirtyTasks);
              }

              const cloudTasks = await fetchTasksServer();

              console.log('☁️ Cloud tasks:', cloudTasks);

              if (cloudTasks?.length) {
                const grouped = cloudTasks.reduce((acc, task) => {
                  const dateKey = getDateKey(new Date(task.scheduledAt));
                  acc[dateKey] = acc[dateKey] || [];
                  acc[dateKey].push({
                    ...task,
                    isSynced: true,
                    isDirty: false,
                    lastSyncedAt: new Date(),
                  });
                  return acc;
                }, {} as Record<string, Task[]>);

                for (const dateTasks of Object.values(grouped)) {
                  dateTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                }

                set({ tasksByDate: grouped });
                localStorage.setItem('tasks', JSON.stringify(grouped));
              }
            } catch (error) {
              console.error('�� Error during cloud sync:', error);
            }
          },

          // Establece la fecha seleccionada
          // setCurrentDate: (date) => set({ currentDate: date }),
          setCurrentDate: (date) => {
            set({ currentDate: date });
            get().setCurrentDayTasks(); // Actualiza las tareas para la fecha actual
          },

          // Establece la capacidad del día en horas
          setDayCapacity: (capacity) => {
            set({ dayCapacity: capacity });
            // get().calculateTotalMinutes(); // Añadir esto si necesitas lógica adicional
          },

          // Obtiene las tareas para una fecha específica
          getTasksForDate: (date) => {
            const dateKey = getDateKey(date);
            return get().tasksByDate[dateKey] || [];
          },

          // Establece las tareas de un día
          setTasks: (tasks) => {
            set(
              (state) => {
                // Force a new reference for the entire state
                const newTasksByDate = { ...tasks };
                const currentDateKey = getDateKey(state.currentDate);

                // Also update currentDayTasks to ensure UI updates
                const currentDayTasks = newTasksByDate[currentDateKey] || [];

                localStorage.setItem('tasks', JSON.stringify(newTasksByDate));

                return {
                  tasksByDate: newTasksByDate,
                  currentDayTasks,
                };
              },
              false,
              'setTasks',
            );
          },

          // Agrega una nueva tarea
          addTask: async ({ title, size, tagKey, scheduledAt }) => {
            console.log('taskkey', tagKey);
            const currentDate = new Date();
            const normalizedDate = scheduledAt ? new Date(scheduledAt) : new Date();
            normalizedDate.setHours(0, 0, 0, 0);
            const dateKey = getDateKey(normalizedDate);

            const tasksByDate = { ...get().tasksByDate };
            const dateTasks = tasksByDate[dateKey] || [];
            const maxOrder = dateTasks.length > 0 ? Math.max(...dateTasks.map((t) => t.order ?? 0)) : -1;

            const task: Task = {
              _id: nanoid(),
              title,
              size,
              tagKey,
              status: 'pending',
              duration: size * 15,
              elapsed: 0,
              createdAt: currentDate,
              scheduledAt: normalizedDate,
              order: maxOrder + 1,
              userId: nanoid() || 'local',
              updatedAt: new Date(),
              isDirty: true,
              isSynced: false,
            };

            const updatedDateTasks = [...dateTasks, task].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            tasksByDate[dateKey] = updatedDateTasks;
            set({ tasksByDate });
            // Actualizamos currentDayTasks
            const currentDateKey = getDateKey(get().currentDate);
            const updatedTasks = tasksByDate[currentDateKey] || [];
            set({ currentDayTasks: updatedTasks });
            get().calculateTotalMinutes();
            localStorage.setItem('tasks', JSON.stringify(tasksByDate));

            if (isCloudSyncEnabled) await addTaskServer(task);
          },

          // Actualiza una tarea existente
          updateTask: async (id, updates, options) => {
            const tasksByDate = structuredClone(get().tasksByDate);
            let originalDateKey: string | null = null;
            let targetTask: Task | null = null;
            let parentTask: Task | null = null;

            // Find the task to update across all dates
            for (const [key, dateTasks] of Object.entries(tasksByDate)) {
              // Check for the task directly in the main tasks list
              const taskIndex = dateTasks.findIndex((t) => t._id === id);
              if (taskIndex > -1) {
                originalDateKey = key;
                targetTask = dateTasks[taskIndex];
                break;
              }

              // Check if task is a subtask of any task
              for (const task of dateTasks) {
                if (task.subtasks?.some((subtask) => subtask._id === id)) {
                  originalDateKey = key;
                  targetTask = task.subtasks.find((subtask) => subtask._id === id) || null;
                  parentTask = task;
                  break;
                }
              }

              if (targetTask) break;
            }

            if (!targetTask || !originalDateKey) {
              console.error('Task not found:', id);
              return;
            }

            // If changing schedule date
            let targetDateKey = originalDateKey;
            if (updates.scheduledAt) {
              const newDate = new Date(updates.scheduledAt);
              newDate.setHours(0, 0, 0, 0);
              targetDateKey = newDate.getTime().toString();
            }

            // If changing status to ongoing, pause other ongoing tasks
            if (updates.status === 'ongoing' && !options?.disableAutoPause) {
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              const todayKey = currentDate.getTime().toString();

              if (tasksByDate[todayKey]) {
                const ongoingTasks = tasksByDate[todayKey].filter((t) => t.status === 'ongoing' && t._id !== id);

                for (const task of ongoingTasks) {
                  task.status = 'paused';
                  task.updatedAt = new Date();
                  task.isDirty = true;
                }
              }
            }

            // Create updated task object
            const updatedTask = {
              ...targetTask,
              ...updates,
              updatedAt: new Date(),
              isDirty: true,
            };

            // If task is a subtask, update it in parent's subtasks array
            if (parentTask) {
              // Update in parent's subtasks array
              const parentIndex = tasksByDate[originalDateKey].findIndex((t) => t._id === parentTask?._id);
              if (parentIndex > -1) {
                const updatedSubtasks = (parentTask.subtasks || []).map((subtask) =>
                  subtask._id === id ? updatedTask : subtask,
                );

                tasksByDate[originalDateKey][parentIndex] = {
                  ...tasksByDate[originalDateKey][parentIndex],
                  subtasks: updatedSubtasks,
                };
              }
            }
            // Otherwise update in the main tasks array
            else if (originalDateKey === targetDateKey) {
              const taskIndex = tasksByDate[originalDateKey].findIndex((t) => t._id === id);
              if (taskIndex > -1) {
                // Create a new array reference for the date's tasks
                tasksByDate[originalDateKey] = [
                  ...tasksByDate[originalDateKey].slice(0, taskIndex),
                  updatedTask,
                  ...tasksByDate[originalDateKey].slice(taskIndex + 1),
                ];
              }
            } else {
              // Moving to different date - remove from original date
              tasksByDate[originalDateKey] = tasksByDate[originalDateKey].filter((t) => t._id !== id);

              // Add to target date
              tasksByDate[targetDateKey] = tasksByDate[targetDateKey] || [];
              tasksByDate[targetDateKey].push(updatedTask);
            }

            // Update store with new state ensuring it's a new reference
            set(
              (state) => {
                // Create fresh currentDayTasks reference based on current date
                const currentDateKey = getDateKey(state.currentDate);
                const currentDayTasks = tasksByDate[currentDateKey] || [];

                return {
                  tasksByDate: { ...tasksByDate },
                  currentDayTasks: [...currentDayTasks],
                };
              },
              false,
              'updateTask',
            );

            localStorage.setItem('tasks', JSON.stringify(tasksByDate));

            // Also update in server if enabled
            if (isCloudSyncEnabled && targetTask) {
              try {
                await syncTasksToServer([updatedTask]);
              } catch (error) {
                console.error('Error syncing updated task:', error);
              }
            }
          },

          deleteTask: async (id) => {
            const tasksByDate = structuredClone(get().tasksByDate);
            const deletedTasks = structuredClone(get().deletedTasks || {});

            let deletedTask: Task | null = null;

            for (const [key, dateTasks] of Object.entries(tasksByDate)) {
              const index = dateTasks.findIndex((t) => t._id === id);
              if (index !== -1) {
                deletedTask = dateTasks[index];
                dateTasks.splice(index, 1);
                if (dateTasks.length === 0) delete tasksByDate[key];
                break;
              }
            }

            if (deletedTask) {
              deletedTasks[deletedTask._id] = {
                ...deletedTask,
                deletedAt: new Date(),
              };
            }

            set({ tasksByDate, deletedTasks });

            const currentDateKey = getDateKey(get().currentDate);
            const updatedTasks = tasksByDate[currentDateKey] || [];
            set({ currentDayTasks: updatedTasks });

            get().calculateTotalMinutes();
            localStorage.setItem('tasks', JSON.stringify(tasksByDate));
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
          },

          deleteAllDayTasks: async (dayToDelete: Date) => {
            const tasksByDate = structuredClone(get().tasksByDate);
            const deletedTasks = structuredClone(get().deletedTasks || {});
            const dateKey = getDateKey(dayToDelete);

            if (tasksByDate[dateKey]) {
              for (const task of tasksByDate[dateKey]) {
                deletedTasks[task._id] = {
                  ...task,
                  deletedAt: new Date(),
                };
              }

              delete tasksByDate[dateKey];

              set({ tasksByDate, deletedTasks });
              set({ currentDayTasks: [] });

              get().calculateTotalMinutes();
              localStorage.setItem('tasks', JSON.stringify(tasksByDate));
              localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            }
          },

          // Establece las tareas del día seleccionado
          setCurrentDayTasks: () => {
            const tasks = get().getTasksForDate(get().currentDate);
            set({ currentDayTasks: tasks });
            get().calculateTotalMinutes(); // Añadir esto
          },

          // Calcula el total de minutos de tareas del día seleccionado
          // calculateTotalMinutes: () => {
          //   const total = get().currentDayTasks.reduce((sum, task) => sum + task.duration, 0);
          //   set({ totalMinutes: total });
          // },
          calculateTotalMinutes: () => {
            const total = get().currentDayTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
            console.log('Total minutes:', total); // Debugging line
            set({ totalMinutes: total });
          },

          syncTasks: async () => {
            const allTasks = Object.values(get().tasksByDate).flat();
            const deletedTasksObj = get().deletedTasks || {};
            const deletedTasks = Object.values(deletedTasksObj);

            const dirtyTasks = allTasks.filter((t) => t.isDirty);
            const tasksToSync = [...dirtyTasks, ...deletedTasks];

            if (tasksToSync.length > 0 && isCloudSyncEnabled) {
              // if (tasksToSync.length > 0) {
              await syncTasksToServer(tasksToSync);

              const updatedTasksByDate = structuredClone(get().tasksByDate);

              for (const task of dirtyTasks) {
                const key = getDateKey(task.scheduledAt);
                const index = updatedTasksByDate[key]?.findIndex((t) => t._id === task._id);
                if (index !== undefined && index > -1) {
                  updatedTasksByDate[key][index] = {
                    ...task,
                    isDirty: false,
                    isSynced: true,
                    lastSyncedAt: new Date(),
                  };
                }
              }

              set({ tasksByDate: { ...updatedTasksByDate } });
              localStorage.setItem('tasks', JSON.stringify(updatedTasksByDate));

              // Limpieza local de eliminadas
              set({ deletedTasks: {} });
              localStorage.removeItem('deletedTasks');
            }
          },

          setDragOverTarget: (target: DragOverTarget) => set({ dragOverTarget: target }),

          setHoverTarget: (target: DragOverTarget | null) => {
            const now = Date.now();
            set({
              hoverTarget: target,
              hoverStartTime: target ? now : null,
            });
          },

          // SELECTORS
          isReadyToGroup: () => {
            const { hoverStartTime } = get();
            return !!hoverStartTime && Date.now() - hoverStartTime > 800;
          },
        };
      },
      {
        name: 'task-store',
      },
    ),
  ),
);
