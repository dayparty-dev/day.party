'use client';

import { Resizable } from 're-resizable';
import { useState, useCallback } from 'react';
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

import './styles.scss';

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

  const bind = useLongPress(
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
    height: `${task.size * 60}px`,
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
      <div className="task-content">
        <Resizable
          size={{ width: '100%', height: '100%' }}
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
          onResizeStop={(_e, _direction, _ref, d) => {
            const newHeight = Math.round((task.size * 60 + d.height) / 60) * 60;
            const newSize = newHeight / 60;
            onResize(task._id, newSize);
          }}
          className="task-resizable"
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
            {...(isEditMode ? listeners : {})}
            {...(isEditMode ? {} : bind())}
          >
            <h3>{task.title}</h3>
            <p className="duration">{task.size * 15} mins</p>
          </div>
          <button
            className={`status ${task.status}`}
            onClick={() => onStatusChange(task._id)}
            aria-pressed={task.status === 'ongoing'}
            aria-label={`Toggle task status: currently ${task.status}`}
          >
            {task.status}
          </button>
        </Resizable>
      </div>
    </div>
  );
};

export default function Rundown() {
  const { tasks, addTask, updateTask, deleteTask, setTasks } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);

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
        const oldIndex = tasks.findIndex((task) => task._id === active.id);
        const newIndex = tasks.findIndex((task) => task._id === over.id);

        // Create new array with the moved item
        const newTasks = arrayMove(tasks, oldIndex, newIndex);

        // First update the local state immediately for UI responsiveness
        setTasks(
          newTasks.map((task, index) => ({
            ...task,
            order: index,
          }))
        );

        // Then update the backend
        newTasks.forEach((task, index) => {
          updateTask(task._id, { ...task, order: index });
        });
      }
    },
    [tasks, setTasks, updateTask]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        addTask({ title: newTaskTitle, size: newTaskSize });
        setNewTaskTitle('');
        setNewTaskSize(1);
      }
    },
    [newTaskTitle, newTaskSize, addTask]
  );

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
            {tasks.map((task) => (
              <SortableTask
                key={task._id}
                task={task}
                isEditMode={isEditMode}
                onDelete={deleteTask}
                onResize={(id, size) => updateTask(id, { size })}
                onStatusChange={(id) =>
                  updateTask(id, {
                    status: task.status === 'pending' ? 'ongoing' : 'pending',
                  })
                }
                onLongPress={() => setIsEditMode(true)}
              />
            ))}
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
