'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
// import useTasks from '../_hooks/useTasks';
import useTaskManager from './scripts/useTaskManager';
// import {
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from '@dnd-kit/core';
// import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Modifier } from '@dnd-kit/core';

import { TaskStatus } from '../_models/Task';
// import ReactDOM from 'react-dom/client';

import DayCapacity from 'app/rundown/components/DayCapacity';
import DayNavigator from 'app/rundown/components/DayNavigator';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import a from "../i18n"; // Importa la inicialización

import { useTaskHandlers } from './scripts/useTaskHandlers';
import { useTaskUtils } from './scripts/useTaskUtils';
import { useDndSensors } from './scripts/useDndSensors';
import { TaskProvider, useTaskContext } from './scripts/TaskContext';
import { useAuthGuard } from 'app/auth/_hooks/useAuthGuard';
import { useTranslation } from 'next-i18next';

import './styles.scss';

// Preventable scale modifier
const preventScaleModifier: Modifier = ({ transform }) => {
  if (!transform) return transform;

  const { x, y } = transform;

  return {
    x,
    y,
    scaleX: 1,
    scaleY: 1,
  };
};

export default function Rundown() {
  const { t } = useTranslation("", { "i18n": a });

  // Task management
  const { tasks,
    addTask,
    updateTask,
    deleteTask,
    setTasks,
    currentDate,
    setCurrentDate,
    dayCapacity,
    setDayCapacity,
    currentDayTasks,
    totalMinutes, } =
    useTaskManager();
  // const { tasks,
  //   addTask,
  //   updateTask,
  //   deleteTask,
  //   setTasks,
  //   currentDate,
  //   setCurrentDate,
  //   dayCapacity,
  //   setDayCapacity,
  //   currentDayTasks,
  //   totalMinutes,
  // } = useTaskContext();

  const dndSensors = useDndSensors();

  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState(1);

  const { ensureOneOngoingTask } = useTaskUtils({ tasks, setTasks, updateTask, currentDayTasks });
  const { handleDragEnd, handleSubmit, handleStatusChange, handleTaskResize } = useTaskHandlers({ tasks, setTasks, updateTask, currentDate, setCurrentDate, currentDayTasks, addTask, newTaskTitle, setNewTaskTitle, newTaskSize, setNewTaskSize, totalMinutes, dayCapacity });
  // const [currentDate, setCurrentDate] = useState(new Date());
  // const [dayCapacity, setDayCapacity] = useState(8); // 8 hours default

  // const [isFinishing, setIsFinishing] = useState(false);

  // Memoized current day tasks to avoid redundant calls to getTasksForDate
  // const currentDayTasks = useMemo(
  //   () => getTasksForDate(currentDate),
  //   [getTasksForDate, currentDate, tasks]
  // );

  /**
   * Gets the current active task and the next task
   */
  // const getCurrentAndNextTask = (taskList) => {
  //   const incompleteTasks = taskList.filter((task) => task.status !== 'done');

  //   let currentTask = incompleteTasks.find((task) => task.status === 'ongoing');

  //   if (!currentTask) {
  //     currentTask = incompleteTasks.find((task) => task.status === 'paused');
  //   }

  //   if (!currentTask) {
  //     currentTask = incompleteTasks.find((task) => task.status === 'pending');
  //   }

  //   if (!currentTask) return { currentTask: null, nextTask: null };

  //   const currentTaskIndex = incompleteTasks.findIndex(
  //     (task) => task._id === currentTask._id
  //   );
  //   const nextTask = incompleteTasks[currentTaskIndex + 1] || null;

  //   return { currentTask, nextTask };
  // };

  // Only check for multiple ongoing tasks on initial load
  useEffect(() => {
    ensureOneOngoingTask();
  }, []); // Empty dependency array means it only runs once on mount

  const { authGuard } = useAuthGuard();

  return authGuard(
    // <TaskProvider>
    <div className={`rundown ${isEditMode ? 'edit-mode' : ''}`}>
      <div className='w-full sm:w-3/5 p-4 sm:p-0 mx-auto flex flex-col gap-4'>
        {isEditMode && (
          <TaskForm
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            newTaskSize={newTaskSize}
            setNewTaskSize={setNewTaskSize}
            onSubmit={handleSubmit}
          />
        )}

        <DayNavigator currentDate={currentDate} onDateChange={setCurrentDate} />
        <DayCapacity
          capacity={dayCapacity}
          used={totalMinutes}
          onCapacityChange={setDayCapacity}
        />

        <TaskList
          tasks={tasks}
          currentDayTasks={currentDayTasks}
          isEditMode={isEditMode}
          sensors={dndSensors}
          preventScaleModifier={preventScaleModifier}
          onDragEnd={handleDragEnd}
          onDelete={deleteTask}
          onResize={handleTaskResize}
          onStatusChange={handleStatusChange}
          onLongPress={() => setIsEditMode(true)}
          setIsEditMode={setIsEditMode}
        />

        {isEditMode && (
          <button className="btn btn-primary absolute bottom-1.5 right-1.5 rounded-2xl" onClick={() => setIsEditMode(false)}>
            Done
          </button>
        )}
      </div>

    </div>
  );
}
{/* </TaskProvider> */ }