'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import useTasks from '../_hooks/useTasks';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Modifier } from '@dnd-kit/core';
import { TaskStatus } from '../_models/Task';
import ReactDOM from 'react-dom/client';

import './styles.scss';
import DayCapacity from 'app/rundown/components/DayCapacity';
import DayNavigator from 'app/rundown/components/DayNavigator';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import PictureInPictureButton from './components/PictureInPictureButton';
import PiPManager, {
  setupPiPStyles,
  copyStylesheets,
} from './components/PiPManager';
import { useAuthGuard } from 'app/auth/_hooks/useAuthGuard';

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
  // Task management
  const { tasks, addTask, updateTask, deleteTask, setTasks, getTasksForDate } =
    useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayCapacity, setDayCapacity] = useState(8); // 8 hours default

  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Picture-in-Picture state
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(
    null
  );

  // Memoized current day tasks to avoid redundant calls to getTasksForDate
  const currentDayTasks = useMemo(
    () => getTasksForDate(currentDate),
    [getTasksForDate, currentDate, tasks]
  );

  // Calculate total minutes once
  const totalMinutes = useMemo(
    () => currentDayTasks.reduce((acc, task) => acc + task.size * 15, 0),
    [currentDayTasks]
  );

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Gets the current active task and the next task
   */
  const getCurrentAndNextTask = (taskList) => {
    // Filter out 'done' tasks first
    const incompleteTasks = taskList.filter((task) => task.status !== 'done');

    // First try to find an ongoing task
    let currentTask = incompleteTasks.find((task) => task.status === 'ongoing');

    // If no ongoing task, get the first paused task
    if (!currentTask) {
      currentTask = incompleteTasks.find((task) => task.status === 'paused');
    }

    // If still no task, get the first pending task
    if (!currentTask) {
      currentTask = incompleteTasks.find((task) => task.status === 'pending');
    }

    if (!currentTask) return { currentTask: null, nextTask: null };

    // Find the next incomplete task
    const currentTaskIndex = incompleteTasks.findIndex(
      (task) => task._id === currentTask._id
    );
    const nextTask = incompleteTasks[currentTaskIndex + 1] || null;

    return { currentTask, nextTask };
  };

  // Get current and next tasks (memoized)
  const { currentTask, nextTask } = useMemo(() => {
    return getCurrentAndNextTask(currentDayTasks);
  }, [currentDayTasks]);

  // Check PiP support on mount
  useEffect(() => {
    setIsPiPSupported('documentPictureInPicture' in window);
  }, []);

  // Only check for multiple ongoing tasks on initial load
  useEffect(() => {
    ensureOneOngoingTask();
  }, []); // Empty dependency array means it only runs once on mount

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

  /**
   * Handles drag end event for task reordering
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = currentDayTasks.findIndex(
          (task) => task._id === active.id
        );
        const newIndex = currentDayTasks.findIndex(
          (task) => task._id === over.id
        );

        // Create new array with the moved item
        const newDayTasks = arrayMove(currentDayTasks, oldIndex, newIndex);

        // Update all tasks while preserving tasks from other days
        const otherTasks = tasks.filter(
          (task) =>
            new Date(task.scheduledDate).toDateString() !==
            currentDate.toDateString()
        );

        const updatedTasks = [
          ...otherTasks,
          ...newDayTasks.map((task, index) => ({
            ...task,
            order: index,
          })),
        ];

        // First update the local state immediately for UI responsiveness
        setTasks(updatedTasks);

        // Then update the backend
        newDayTasks.forEach((task, index) => {
          updateTask(task._id, { ...task, order: index });
        });
      }
    },
    [tasks, setTasks, updateTask, currentDate, currentDayTasks]
  );

  /**
   * Handles submission of new task
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        const newTaskMinutes = newTaskSize * 15;
        if (totalMinutes + newTaskMinutes > dayCapacity * 60) {
          if (
            confirm('This will exceed your daily capacity. Move to next day?')
          ) {
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            addTask({
              title: newTaskTitle,
              size: newTaskSize,
              scheduledDate: nextDay,
            });
            setCurrentDate(nextDay);
          }
          return;
        }
        addTask({
          title: newTaskTitle,
          size: newTaskSize,
          scheduledDate: currentDate,
        });
        setNewTaskTitle('');
        setNewTaskSize(1);
      }
    },
    [newTaskTitle, newTaskSize, addTask, currentDate, totalMinutes, dayCapacity]
  );

  /**
   * Handles status change for a task
   */
  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const otherDayTasks = tasks.filter(
        (task) =>
          new Date(task.scheduledDate).toDateString() !==
          currentDate.toDateString()
      );

      // First, update all tasks that need to be changed
      let updatedCurrentDayTasks = [...currentDayTasks];

      // If setting a task to ongoing, pause any currently ongoing task first
      if (newStatus === 'ongoing') {
        // Find and pause any ongoing tasks
        const ongoingTasks = updatedCurrentDayTasks.filter(
          (task) => task.status === 'ongoing' && task._id !== taskId
        );

        // Update backend first for ongoing tasks
        for (const task of ongoingTasks) {
          await updateTask(task._id, { status: 'paused' });
        }

        // Update local state for ongoing tasks
        updatedCurrentDayTasks = updatedCurrentDayTasks.map((task) =>
          task.status === 'ongoing' && task._id !== taskId
            ? { ...task, status: 'paused' as TaskStatus }
            : task
        );
      }

      // Then update the target task in backend
      await updateTask(taskId, { status: newStatus });

      // Update the target task in local state
      updatedCurrentDayTasks = updatedCurrentDayTasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      );

      // Reorder tasks based on status
      const reorderedTasks = updatedCurrentDayTasks.sort((a, b) => {
        if (a.status === 'ongoing') return -1;
        if (b.status === 'ongoing') return 1;
        if (a.status === 'paused' && b.status !== 'paused') return -1;
        if (b.status === 'paused' && a.status !== 'paused') return 1;
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (b.status === 'done' && a.status !== 'done') return -1;
        return a.order - b.order;
      });

      // Update orders and set tasks
      const updatedTasks = [
        ...otherDayTasks,
        ...reorderedTasks.map((task, index) => ({
          ...task,
          order: index,
        })),
      ];

      // Update local state
      setTasks(updatedTasks);

      // Update orders in backend
      for (const task of reorderedTasks) {
        const newOrder = reorderedTasks.findIndex((t) => t._id === task._id);
        if (task.order !== newOrder) {
          await updateTask(task._id, { order: newOrder });
        }
      }
    },
    [tasks, setTasks, updateTask, currentDate, currentDayTasks]
  );

  /**
   * Handles task resizing
   */
  const handleTaskResize = useCallback(
    (id, size) => {
      const task = tasks.find((t) => t._id === id);
      const otherTasksMinutes = currentDayTasks
        .filter((t) => t._id !== id)
        .reduce((acc, t) => acc + t.size * 15, 0);
      const newTaskMinutes = size * 15;

      if (otherTasksMinutes + newTaskMinutes > dayCapacity * 60) {
        if (
          confirm('This will exceed your daily capacity. Move to next day?')
        ) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          updateTask(id, { size, scheduledDate: nextDay });
          setCurrentDate(nextDay);
        }
        return;
      }
      updateTask(id, { size });
    },
    [tasks, updateTask, currentDate, dayCapacity, currentDayTasks]
  );

  /**
   * Handles task completion and moves to the next task
   */
  const handleTaskFinish = useCallback(async () => {
    if (isFinishing) return; // ignore subsequent clicks
    setIsFinishing(true);

    if (!currentTask) {
      setIsFinishing(false);
      return;
    }

    try {
      // Update the current task to "done"
      await updateTask(currentTask._id, { status: 'done' });

      // Update the next task to "ongoing" with disableAutoPause
      if (nextTask) {
        await updateTask(
          nextTask._id,
          { status: 'ongoing' },
          { disableAutoPause: true }
        );
      }
    } finally {
      setIsFinishing(false);
    }
  }, [currentTask, nextTask, updateTask, isFinishing]);

  /**
   * Updates the PiP window content
   */
  const updatePipContent = () => {
    if (pipRootRef.current && isPiPActive) {
      pipRootRef.current.render(
        <PiPManager
          isPiPActive={isPiPActive}
          currentTask={currentTask}
          nextTask={nextTask}
          onStatusChange={handleStatusChange}
          onFinish={handleTaskFinish}
        />
      );
    }
  };

  // Update PiP content when tasks change
  useEffect(() => {
    updatePipContent();
  }, [
    tasks,
    isPiPActive,
    currentTask,
    nextTask,
    handleStatusChange,
    handleTaskFinish,
  ]);

  /**
   * Activates Picture-in-Picture mode
   */
  const handlePiPActivate = useCallback(async () => {
    if (!isPiPActive && isPiPSupported && currentTask) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 240,
          initialAspectRatio: 320 / 240,
          copyStyleSheets: true,
        });
        setPipWindow(pipWindow);
        setIsPiPActive(true);

        // Copy stylesheets and set up styles
        copyStylesheets(pipWindow);
        setupPiPStyles(pipWindow);

        // Create a new container for the PiP content
        const pipContainer = document.createElement('div');
        pipWindow.document.body.appendChild(pipContainer);

        // Create a new root and render the PiP content
        const root = ReactDOM.createRoot(pipContainer);
        pipRootRef.current = root;
        root.render(
          <PiPManager
            isPiPActive={isPiPActive}
            currentTask={currentTask}
            nextTask={nextTask}
            onStatusChange={handleStatusChange}
            onFinish={handleTaskFinish}
          />
        );

        pipWindow.addEventListener('unload', () => {
          root.unmount();
          pipRootRef.current = null;
          setIsPiPActive(false);
          setPipWindow(null);
        });
      } catch (error) {
        console.error('Failed to enter Picture-in-Picture mode:', error);
      }
    }
  }, [
    currentTask,
    nextTask,
    isPiPActive,
    isPiPSupported,
    handleStatusChange,
    handleTaskFinish,
  ]);

  const { authGuard } = useAuthGuard();

  return authGuard(
    <div className={`rundown ${isEditMode ? 'edit-mode' : ''}`}>
      <div className="header-actions">
        <PictureInPictureButton
          onActivate={handlePiPActivate}
          isActive={isPiPActive}
          isPiPSupported={isPiPSupported}
          isEditMode={isEditMode}
        />
      </div>

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
        sensors={sensors}
        preventScaleModifier={preventScaleModifier}
        onDragEnd={handleDragEnd}
        onDelete={deleteTask}
        onResize={handleTaskResize}
        onStatusChange={handleStatusChange}
        onLongPress={() => setIsEditMode(true)}
        setIsEditMode={setIsEditMode}
      />

      {isEditMode && (
        <button className="done-button" onClick={() => setIsEditMode(false)}>
          Done
        </button>
      )}

      <PiPManager
        isPiPActive={isPiPActive}
        currentTask={currentTask}
        nextTask={nextTask}
        onStatusChange={handleStatusChange}
        onFinish={handleTaskFinish}
      />
    </div>
  );
}
