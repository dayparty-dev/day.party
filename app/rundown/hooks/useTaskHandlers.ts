import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskStore } from 'app/_stores/useTaskStore';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { TaskStatus, Task } from '../../_models/Task';
import { nanoid } from 'nanoid';

export function useTaskHandlers() {
  const tasksByDate = useTaskStore((s) => s.tasksByDate);
  const setTasks = useTaskStore((s) => s.setTasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const currentDate = useTaskStore((s) => s.currentDate);
  const setCurrentDate = useTaskStore((s) => s.setCurrentDate);
  const currentDayTasks = useTaskStore((s) => s.currentDayTasks);
  const dayCapacity = useTaskStore((s) => s.dayCapacity);
  const setDragOverTarget = useTaskStore((s) => s.setDragOverTarget);
  // const hoverTarget = useTaskStore((s) => s.hoverTarget);
  // const isReadyToGroup = useTaskStore((s) => s.isReadyToGroup);
  const setHoverTarget = useTaskStore((s) => s.setHoverTarget); // Para limpiarlo después
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log("Active", active);
    const activeTask = active.data.current as Task;
    const draggedTaskId = active.id.toString();
  
    const currentDayTasks = useTaskStore.getState().currentDayTasks;
    const hoverTarget = useTaskStore.getState().hoverTarget;
    const isReadyToGroup = useTaskStore.getState().isReadyToGroup;
    const setHoverTarget = useTaskStore.getState().setHoverTarget;
  
    setHoverTarget(null); // Resetear el estado del hover
  
    const currentDateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
    const otherTasks = Object.entries(tasksByDate)
      .filter(([key]) => key !== currentDateKey)
      .flatMap(([_, tasks]) => tasks);
  
    // 💡 Agrupar si corresponde
    if (
      isReadyToGroup &&
      hoverTarget &&
      draggedTaskId !== hoverTarget.id
    ) {
      const draggedTask = currentDayTasks.find(t => t._id === draggedTaskId);
      const targetTask = currentDayTasks.find(t => t._id === hoverTarget.id);
      if (!draggedTask || !targetTask) return;
  
      // 🧩 Crear grupo
      if (hoverTarget.type === 'task') {
        const groupId = nanoid();
        const now = new Date();
  
        const newGroup = {
          ...targetTask,
          _id: groupId,
          title: 'Grupo sin nombre',
          isGroup: true,
          children: [targetTask._id, draggedTask._id],
          createdAt: now,
        };
  
        await updateTask(groupId, newGroup);
        await updateTask(draggedTask._id, { parentId: groupId });
        await updateTask(targetTask._id, { parentId: groupId });
  
        const updated = currentDayTasks
          .filter(t => t._id !== draggedTaskId && t._id !== targetTask._id)
          .concat(newGroup);
  
        const newTasksByDate = {
          ...tasksByDate,
          [currentDateKey]: updated,
        };
        setTasks(newTasksByDate);
        return;
      }
  
      // ➕ Añadir a grupo
      if (hoverTarget.type === 'group') {
        const group = currentDayTasks.find(t => t._id === hoverTarget.id && t.isGroup);
        if (!group) return;
  
        const newChildren = [...(group.subtasks || []), draggedTaskId];
        await updateTask(group._id, { subtasks: newChildren });
        await updateTask(draggedTaskId, { parentId: group._id });
  
        const updated = currentDayTasks.filter(t => t._id !== draggedTaskId);
        const newTasksByDate = {
          ...tasksByDate,
          [currentDateKey]: updated,
        };
        setTasks(newTasksByDate);
        return;
      }
    }

    // DESAGRUPACIÓN
    // if (!hoverTarget && isReadyToGroup) {
    //   // const activeTask = active.data.current as Task;
    //   if (activeTask?.parentId) {
    //     // Actualizamos la tarea para desagruparla
    //     updateTask(activeTask._id, { ...activeTask, parentId: null });

    //     // También lo reflejamos en el estado local
    //     const newTasksByDate = structuredClone(tasksByDate);
    //     const dateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
    //     newTasksByDate[dateKey] = newTasksByDate[dateKey].map((t) =>
    //       t._id === activeTask._id ? { ...t, groupId: null } : t
    //     );
    //     setTasks(newTasksByDate);
    //   }
    // }
    // Desagrupar si es una subtask que se ha soltado fuera del grupo
if (
  activeTask.parentId && // Es una subtask
  (
    !over || // Se soltó fuera de cualquier tarea
    (hoverTarget?.type === 'task' && hoverTarget.id !== activeTask.parentId) || // Sobre otra task
    (hoverTarget?.type === 'group' && hoverTarget.id !== activeTask.parentId)   // Sobre otro grupo
  )
) {
  // 1. Buscar el grupo original (parent)
  const parentTask = currentDayTasks.find(t => t._id === activeTask.parentId);
  if (!parentTask) return;

  // 2. Quitar la subtask del grupo
  parentTask.subtasks = parentTask.subtasks?.filter(id => id !== draggedTaskId) || [];

  // 3. Eliminar parentId de la subtask (ahora es independiente)
  activeTask.parentId = undefined;

  // 4. Añadir la subtask a la lista principal
  currentDayTasks.push(activeTask);

  // 5. Reordenar tareas
  const reordered = currentDayTasks
    .filter(t => !t.parentId) // solo tareas principales
    .sort((a, b) => a.order - b.order);

  // 6. Actualizar estado local
  const newTasksByDate = structuredClone(tasksByDate);
  const dateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
  newTasksByDate[dateKey] = reordered;
  setTasks(newTasksByDate);

  // 7. Actualizar backend
  updateTask(activeTask._id, { ...activeTask, parentId: null });
  updateTask(parentTask._id, { ...parentTask });
}

  
    // 🪄 Si no hubo agrupación, reordenar normalmente
    if (over && draggedTaskId !== over.id) {
      const oldIndex = currentDayTasks.findIndex(task => task._id === draggedTaskId);
      const newIndex = currentDayTasks.findIndex(task => task._id === over.id);
  
      const newDayTasks = arrayMove(currentDayTasks, oldIndex, newIndex);
  
      const updatedTasks = [
        ...otherTasks,
        ...newDayTasks.map((task, index) => ({ ...task, order: index }))
      ];
  
      const newTasksByDate = {
        ...tasksByDate,
        [currentDateKey]: newDayTasks.map((task, index) => ({ ...task, order: index })),
      };
      setTasks(newTasksByDate);
  
      newDayTasks.forEach((task, index) => {
        updateTask(task._id, { ...task, order: index });
      });
    }
  }, [tasksByDate, currentDate, currentDayTasks, setTasks, updateTask]);
  
const handleDragOver = useCallback((event: DragOverEvent) => {
  const { over, active } = event;
    if (!over || active.id === over.id) {
    setDragOverTarget(null);
    return;
  }

  const overId = over.id.toString();

  console.log("🔷 active.id:", active.id);
  console.log("🔶 over.id:", over?.id);
  
  if (overId.startsWith('task-')) {
    const taskId = overId.replace('task-', '');
    console.log("➡ Hovering over task:", taskId);
    setHoverTarget({ type: 'task', id: taskId });
  } else if (overId.startsWith('group-')) {
    const groupId = overId.replace('group-', '');
    console.log("➡ Hovering over group:", groupId);
    setHoverTarget({ type: 'group', id: groupId });
  } else {
    console.log("❌ Not hovering over a valid target");
    setHoverTarget(null);
  }
}, [setHoverTarget]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const dateKey = new Date(new Date(currentDate).setHours(0, 0, 0, 0)).getTime().toString();
    const otherDayTasks = Object.entries(tasksByDate)
      .filter(([key]) => key !== dateKey)
      .flatMap(([_, tasks]) => tasks);

    let updatedCurrentDayTasks = [...currentDayTasks];

    if (newStatus === 'ongoing') {
      const ongoingTasks = updatedCurrentDayTasks.filter(t => t.status === 'ongoing' && t._id !== taskId);
      for (const task of ongoingTasks) {
        await updateTask(task._id, { status: 'paused' });
      }
      updatedCurrentDayTasks = updatedCurrentDayTasks.map(task =>
        task.status === 'ongoing' && task._id !== taskId
          ? { ...task, status: 'paused' }
          : task
      );
    }

    await updateTask(taskId, { status: newStatus });

    updatedCurrentDayTasks = updatedCurrentDayTasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    );

    const reorderedTasks = updatedCurrentDayTasks.sort((a, b) => {
      if (a.status === 'ongoing') return -1;
      if (b.status === 'ongoing') return 1;
      if (a.status === 'paused' && b.status !== 'paused') return -1;
      if (b.status === 'paused' && a.status !== 'paused') return 1;
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (b.status === 'done' && a.status !== 'done') return -1;
      return a.order - b.order;
    });

    const newTasksByDate = structuredClone(tasksByDate);
    newTasksByDate[dateKey] = reorderedTasks.map((task, index) => ({ ...task, order: index }));
    setTasks(newTasksByDate);

    for (const task of reorderedTasks) {
      const newOrder = reorderedTasks.findIndex((t) => t._id === task._id);
      if (task.order !== newOrder) {
        await updateTask(task._id, { order: newOrder });
      }
    }
  }, [tasksByDate, currentDayTasks, currentDate, setTasks, updateTask]);

  const handleTaskResize = useCallback(async (id: string, size: number) => {
    const task = currentDayTasks.find((t) => t._id === id);
    if (!task) return;

    const otherTasksMinutes = currentDayTasks
      .filter((t) => t._id !== id)
      .reduce((acc, t) => acc + t.size * 15, 0);

    const newTaskMinutes = size * 15;

    if (otherTasksMinutes + newTaskMinutes > dayCapacity * 60) {
      if (confirm('Esto excede tu capacidad diaria. ¿Mover a otro día?')) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        await updateTask(id, { size, duration: newTaskMinutes, scheduledAt: nextDay });
        setCurrentDate(nextDay);
        return;
      }
    }

    await updateTask(id, { size, duration: newTaskMinutes });
  }, [currentDayTasks, currentDate, dayCapacity, updateTask, setCurrentDate]);

  return { handleDragEnd, handleDragOver, handleStatusChange, handleTaskResize };
}
