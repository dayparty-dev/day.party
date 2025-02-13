'use client';

import { Resizable } from 're-resizable';
import { useState, useCallback, useEffect } from 'react';
import useTasks from '../_hooks/useTasks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useLongPress } from 'use-long-press';
import type { Modifier } from '@dnd-kit/core';
import { Task, TaskStatus } from '../../models/Task';

import './styles.scss';
import DayCapacity from 'app/rundown/components/DayCapacity';
import DayNavigator from 'app/rundown/components/DayNavigator';

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

const SortableTask = ({
  task,
  isEditMode,
  onDelete,
  onStatusChange,
  onResize,
  onLongPress,
}) => {
  const [tempSize, setTempSize] = useState(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
  });

  const longPressBinding = useLongPress(
    () => {
      onLongPress();
    },
    {
      threshold: 500,
      cancelOnMovement: true,
    }
  );

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    position: 'relative',
    zIndex: isDragging ? 999 : 0,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    cursor: isEditMode ? 'grab' : 'default',
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-is-dragging={isDragging}
    >
      <Resizable
        size={{ width: '100%', height: task.size * 60 }}
        enable={
          isEditMode
            ? {
                top: false,
                right: false,
                bottom: true,
                left: false,
              }
            : {}
        }
        grid={[1, 60]}
        minHeight={60}
        onResize={(_e, _direction, _ref, d) => {
          const newSize = Math.max(
            1,
            Math.round((task.size * 60 + d.height) / 60)
          );
          setTempSize(newSize);
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          const newSize = Math.max(
            1,
            Math.round((task.size * 60 + d.height) / 60)
          );
          setTempSize(null);
          if (newSize !== task.size) {
            onResize(task._id, newSize);
          }
        }}
      >
        <div
          className={`task-content ${
            task.status === 'ongoing' ? 'ongoing' : ''
          }`}
        >
          {isEditMode && (
            <button
              className="delete-btn"
              onClick={() => onDelete(task._id)}
              aria-label="Delete task"
            >
              ×
            </button>
          )}
          <div
            className="action"
            {...(isEditMode ? listeners : longPressBinding())}
          >
            <h3>{task.title}</h3>
            <p className="duration">{(tempSize ?? task.size) * 15} mins</p>
            <div className="status-controls">
              <button
                className={`status ${task.status}`}
                onClick={() => {
                  const nextStatus: TaskStatus =
                    {
                      pending: 'ongoing',
                      ongoing: 'paused',
                      paused: 'ongoing',
                      done: 'pending',
                    }[task.status] || 'pending';
                  onStatusChange(task._id, nextStatus);
                }}
                aria-pressed={task.status === 'ongoing'}
                aria-label={`Toggle task status: currently ${task.status}`}
              >
                {task.status}
              </button>
              {task.status !== 'done' && (
                <button
                  className="finish-btn"
                  onClick={() => onStatusChange(task._id, 'done')}
                  aria-label="Mark task as done"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </Resizable>
    </div>
  );
};

export default function Rundown() {
  const { tasks, addTask, updateTask, deleteTask, setTasks, getTasksForDate } =
    useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayCapacity, setDayCapacity] = useState(8); // 8 hours default

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const currentDayTasks = getTasksForDate(currentDate);
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
    [tasks, setTasks, updateTask, currentDate, getTasksForDate]
  );

  const totalMinutes = getTasksForDate(currentDate).reduce(
    (acc, task) => acc + task.size * 15,
    0
  );

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

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const currentDayTasks = getTasksForDate(currentDate);
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
    [tasks, setTasks, updateTask, currentDate, getTasksForDate]
  );

  // Only check for multiple ongoing tasks on initial load
  useEffect(() => {
    const ensureOneOngoingTask = async () => {
      const currentDayTasks = getTasksForDate(currentDate);
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

    // Only run this check once when the component mounts
    ensureOneOngoingTask();
  }, []); // Empty dependency array means it only runs once on mount

  const timeOptions = [
    { value: 1, label: '15 min' },
    { value: 2, label: '30 min' },
    { value: 3, label: '45 min' },
    { value: 4, label: '60 min' },
  ];

  return (
    <div className={`rundown ${isEditMode ? 'edit-mode' : ''}`}>
      {isEditMode && (
        <form onSubmit={handleSubmit} className="task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title"
          />
          <select
            value={newTaskSize}
            onChange={(e) => setNewTaskSize(Number(e.target.value))}
            className="time-select"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit">Add Task</button>
        </form>
      )}

      <DayNavigator currentDate={currentDate} onDateChange={setCurrentDate} />
      <DayCapacity
        capacity={dayCapacity}
        used={totalMinutes}
        onCapacityChange={setDayCapacity}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[preventScaleModifier]}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="actions-wrapper">
            {getTasksForDate(currentDate).map((task) => (
              <SortableTask
                key={task._id}
                task={task}
                isEditMode={isEditMode}
                onDelete={deleteTask}
                onResize={(id, size) => {
                  const task = tasks.find((t) => t._id === id);
                  const otherTasksMinutes = getTasksForDate(currentDate)
                    .filter((t) => t._id !== id)
                    .reduce((acc, t) => acc + t.size * 15, 0);
                  const newTaskMinutes = size * 15;

                  if (otherTasksMinutes + newTaskMinutes > dayCapacity * 60) {
                    if (
                      confirm(
                        'This will exceed your daily capacity. Move to next day?'
                      )
                    ) {
                      const nextDay = new Date(currentDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      updateTask(id, { size, scheduledDate: nextDay });
                      setCurrentDate(nextDay);
                    }
                    return;
                  }
                  updateTask(id, { size });
                }}
                onStatusChange={handleStatusChange}
                onLongPress={() => setIsEditMode(true)}
              />
            ))}

            {/* Add empty state with Create Task button */}
            {getTasksForDate(currentDate).length === 0 && !isEditMode && (
              <div className="empty-day">
                <p>No tasks scheduled for this day</p>
                <button
                  className="create-task-btn"
                  onClick={() => setIsEditMode(true)}
                >
                  Create Task
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isEditMode && (
        <button className="done-button" onClick={() => setIsEditMode(false)}>
          Done
        </button>
      )}
    </div>
  );
}
